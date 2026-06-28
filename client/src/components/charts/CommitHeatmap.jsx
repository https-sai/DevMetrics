import { useEffect, useRef } from "react";
import * as d3 from "d3";

// data: array of { date: '2024-01-01', count: 3 }
export default function CommitHeatmap({ data }) {
  const svgRef = useRef();

  useEffect(() => {
    const cellSize = 14;
    const weeksToShow = 52;
    const margin = { top: 20, left: 40, bottom: 10 };
    const width = weeksToShow * cellSize + margin.left;
    const height = 7 * cellSize + margin.top + margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Clear previous render
    svg.selectAll("*").remove();

    const rows = data ?? [];

    // Map commit count to a 5-level color scale (GitHub-style greens)
    const maxCount = d3.max(rows, (d) => d.count) || 1;
    const color = d3
      .scaleQuantize()
      .domain([0, maxCount])
      .range(["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"]);

    // Build a lookup from date string to count
    const byDate = Object.fromEntries(rows.map((d) => [d.date, d.count]));

    // Generate all days in the last 52 weeks
    const end = new Date();
    const start = d3.timeWeek.offset(d3.timeDay.floor(end), -weeksToShow);
    const allDays = d3.timeDays(start, end);

    // Draw one rect per day
    svg
      .selectAll("rect")
      .data(allDays)
      .join("rect")
      .attr("width", cellSize - 2)
      .attr("height", cellSize - 2)
      .attr("rx", 2) // Slightly rounded corners
      .attr("x", (d) => d3.timeWeek.count(start, d) * cellSize + margin.left)
      .attr("y", (d) => d.getDay() * cellSize + margin.top)
      .attr("fill", (d) => {
        const key = d3.timeFormat("%Y-%m-%d")(d);
        return color(byDate[key] || 0);
      })
      .append("title") // Tooltip on hover
      .text((d) => {
        const key = d3.timeFormat("%Y-%m-%d")(d);
        return `${key}: ${byDate[key] || 0} commits`;
      });

    // Month labels along the top
    const months = d3.timeMonths(start, end);
    svg
      .selectAll("text.month")
      .data(months)
      .join("text")
      .attr("class", "month")
      .attr("x", (d) => d3.timeWeek.count(start, d) * cellSize + margin.left)
      .attr("y", margin.top - 5)
      .attr("fill", "#8b949e")
      .attr("font-size", 10)
      .text(d3.timeFormat("%b"));
  }, [data]);

  return <svg ref={svgRef} />;
}
