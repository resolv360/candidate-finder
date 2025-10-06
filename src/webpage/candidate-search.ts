import { Candidate } from "./types";
import { CandidateResults } from "./candidate-result-types";

export async function searchCandidates(
  queries: string[],
  minResults: number,
  configs: { API_KEY: string; CX: string },
  existingLinks: Set<string> = new Set()
): Promise<Candidate[]> {
  const results: Candidate[] = [];
  const seenLinks = new Set<string>(existingLinks); // Include existing links to avoid duplicates

  let queryIndex = 0;
  let start = 1; // pagination start index (1–100)
  let attemptsWithoutNewResults = 0;
  const maxAttemptsWithoutNewResults = 5; // Stop if we can't find new unique results after 5 attempts

  while (results.length < minResults && queryIndex < queries.length) {
    const query = queries[queryIndex]!;
    const url = new URL("https://www.googleapis.com/customsearch/v1");

    url.searchParams.set("q", query);
    url.searchParams.set("cx", configs.CX);
    url.searchParams.set("key", configs.API_KEY);
    url.searchParams.set("start", start.toString());
    url.searchParams.set("num", "10");

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as CandidateResults;
      const items = data.items || [];

      if (items.length === 0) {
        // finished results for this query → move to next
        queryIndex++;
        start = 1;
        attemptsWithoutNewResults = 0; // Reset counter for new query
        console.debug("Query changed after", seenLinks.size, "items");
        continue;
      }

      const initialResultsCount = results.length;

      for (const item of items) {
        if (!item.link || !item.title) continue;
        if (seenLinks.has(item.link)) {
          console.debug(`Skipping duplicate link: ${item.link}`);
          continue;
        }
        const pageTitle = item["pagemap"]["metatags"][0]["og:title"];
        const match = pageTitle.match(/^(.*?)\s*-\s*(.*?)\s*\|/);
        if (!match) continue;
        const name = match[1].trim();
        const jobTitle = match[2].trim();

        seenLinks.add(item.link);
        results.push({
          pageTitle,
          link: item.link,
          name,
          jobTitle,
        });

        if (results.length >= minResults) {
          console.log(`Found ${results.length} unique candidates (${existingLinks.size} existing were excluded)`);
          return results;
        }
      }

      // Check if we found any new results in this batch
      if (results.length === initialResultsCount) {
        attemptsWithoutNewResults++;
        console.debug(`No new unique results found (attempt ${attemptsWithoutNewResults}/${maxAttemptsWithoutNewResults})`);
        
        if (attemptsWithoutNewResults >= maxAttemptsWithoutNewResults) {
          console.warn(`Stopping search - couldn't find new unique candidates after ${maxAttemptsWithoutNewResults} attempts`);
          console.log(`Returning ${results.length} unique candidates (requested ${minResults})`);
          return results;
        }
      } else {
        attemptsWithoutNewResults = 0; // Reset if we found new results
      }

      // prepare next page
      start += 10;
      if (start > 90) {
        // Google allows only up to 100 results
        queryIndex++;
        start = 1;
        attemptsWithoutNewResults = 0; // Reset counter for new query
        console.debug("Query changed after", seenLinks.size, "items");
      }
    } catch (err) {
      console.error(
        `❌ Error fetching query "${query}" at start=${start}:`,
        err
      );
      // skip to next query on error
      queryIndex++;
      start = 1;
      attemptsWithoutNewResults = 0; // Reset counter
    }
  }

  console.log(`Search completed with ${results.length} unique candidates (requested ${minResults}, ${existingLinks.size} existing excluded)`);
  return results;
}
