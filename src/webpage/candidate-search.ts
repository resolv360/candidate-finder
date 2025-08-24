import { Candidate } from "./types";
import { CandidateResults } from "./candidate-result";

export async function searchCandidates(
  queries: string[],
  minResults: number,
  configs: { API_KEY: string; CX: string }
): Promise<Candidate[]> {
  const results: Candidate[] = [];
  const seenLinks = new Set<string>();

  let queryIndex = 0;
  let start = 1; // pagination start index (1–100)

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
        console.debug("Query changed after", seenLinks.size, "items");
        continue;
      }

      for (const item of items) {
        if (!item.link || !item.title) continue;
        if (seenLinks.has(item.link)) continue;
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
          return results;
        }
      }

      // prepare next page
      start += 10;
      if (start > 90) {
        // Google allows only up to 100 results
        queryIndex++;
        start = 1;
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
    }
  }

  return results;
}
