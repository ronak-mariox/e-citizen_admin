/**
 * Grouped monthly volume.
 *
 * Bars rather than the agent panels' line chart: an admin compares series
 * against each other within a month (how many of the applications we took in
 * did we actually complete), and adjacent bars answer that at a glance where
 * two crossing lines make you trace them.
 *
 * Plain divs, no charting dependency — the panels draw their charts by hand
 * too, and one grouped bar chart does not justify a library.
 */
export function BarChart({ labels, series }) {
  // Shared scale across every series, or a tall bar in one would read as
  // equal to a short bar in another.
  const peak = Math.max(...series.flatMap((line) => line.values), 1);

  return (
    <>
      <div className="bar-chart" role="img" aria-label={describe(labels, series)}>
        {labels.map((label, index) => (
          <div className="bar-chart__col" key={label}>
            <span className="bar-chart__stack">
              {series.map((line) => (
                <span
                  className="bar-chart__bar"
                  key={line.key}
                  style={{
                    height: `${(line.values[index] / peak) * 100}%`,
                    backgroundColor: line.color,
                  }}
                />
              ))}
            </span>
            <span className="bar-chart__label">{label}</span>
          </div>
        ))}
      </div>

      <div className="legend">
        {series.map((line) => (
          <span className="legend__item" key={line.key}>
            <span className="legend__dot" style={{ backgroundColor: line.color }} />
            {line.label}
          </span>
        ))}
      </div>
    </>
  );
}

/* The bars carry no text, so the whole chart gets one spoken summary rather
   than leaving a screen reader with an unlabelled graphic. */
function describe(labels, series) {
  const lines = series.map(
    (line) => `${line.label}: ${line.values.map((value, i) => `${labels[i]} ${value}`).join(', ')}`
  );

  return `Monthly volume. ${lines.join('. ')}.`;
}

export default BarChart;
