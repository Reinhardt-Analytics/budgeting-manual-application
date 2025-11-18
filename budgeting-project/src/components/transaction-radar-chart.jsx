import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import './transaction-radar-chart.css'

function TransactionRadarChart({ data = [] }) {
  const svgRef = useRef()

  useEffect(() => {
    if (!data || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const margin = { top: 50, right: 50, bottom: 50, left: 50 }
    const width = 400 - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom
    const radius = Math.min(width, height) / 2

    const container = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`)

    // Prepare data - normalize to 0-100 scale
    const maxPercentage = d3.max(data, d => d.percentage) || 100
    const normalizedData = data.map(d => ({
      ...d,
      normalizedValue: (d.percentage / maxPercentage) * 100
    }))

    const angleSlice = (Math.PI * 2) / normalizedData.length

    // Create radial scale
    const rScale = d3.scaleLinear()
      .range([0, radius])
      .domain([0, 100])

    // Create the background circles
    const levels = 5
    for (let level = 1; level <= levels; level++) {
      const levelRadius = (radius / levels) * level
      
      container.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", levelRadius)
        .style("fill", "none")
        .style("stroke", "var(--border-color)")
        .style("stroke-opacity", 0.3)
        .style("stroke-width", "1px")

      // Add level labels
      if (level < levels) {
        container.append("text")
          .attr("x", 4)
          .attr("y", -levelRadius)
          .attr("dy", "0.4em")
          .style("font-size", "10px")
          .style("fill", "var(--text-secondary)")
          .text(`${(100 / levels) * level}%`)
      }
    }

    // Create the radial lines
    normalizedData.forEach((d, i) => {
      container.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", radius * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", radius * Math.sin(angleSlice * i - Math.PI / 2))
        .style("stroke", "var(--border-color)")
        .style("stroke-opacity", 0.3)
        .style("stroke-width", "1px")
    })

    // Create the radar chart area
    const radarLine = d3.lineRadial()
      .angle((d, i) => angleSlice * i)
      .radius(d => rScale(d.normalizedValue))
      .curve(d3.curveLinearClosed)

    // Add the area fill
    container.append("path")
      .datum(normalizedData)
      .attr("d", radarLine)
      .style("fill", "#394353")
      .style("fill-opacity", 0.2)
      .style("stroke", "#394353")
      .style("stroke-width", "2px")

    // Add data points
    container.selectAll(".radarCircle")
      .data(normalizedData)
      .enter().append("circle")
      .attr("class", "radarCircle")
      .attr("r", 4)
      .attr("cx", (d, i) => rScale(d.normalizedValue) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("cy", (d, i) => rScale(d.normalizedValue) * Math.sin(angleSlice * i - Math.PI / 2))
      .style("fill", "#394353")
      .style("stroke", "white")
      .style("stroke-width", "2px")

    // Add category labels
    container.selectAll(".radarLabel")
      .data(normalizedData)
      .enter().append("text")
      .attr("class", "radarLabel")
      .attr("x", (d, i) => (radius + 20) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => (radius + 20) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "var(--text-color)")
      .style("text-anchor", (d, i) => {
        const angle = (angleSlice * i) * (180 / Math.PI)
        return angle > 90 && angle < 270 ? "end" : "start"
      })
      .text(d => d.category)

    // Add percentage labels on hover
    const tooltip = container.append("g")
      .attr("class", "tooltip")
      .style("opacity", 0)

    tooltip.append("rect")
      .attr("width", 80)
      .attr("height", 30)
      .attr("x", -40)
      .attr("y", -35)
      .style("fill", "var(--card-background)")
      .style("stroke", "var(--border-color)")
      .style("stroke-width", "1px")
      .style("rx", "4")

    const tooltipText = tooltip.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.5em")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", "var(--text-color)")

    const tooltipAmount = tooltip.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.8em")
      .style("font-size", "10px")
      .style("fill", "var(--text-secondary)")

    // Add hover events to data points
    container.selectAll(".radarCircle")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 6)
          .style("fill", "#2d3441")

        tooltip
          .style("opacity", 1)
          .attr("transform", `translate(${d3.select(this).attr("cx")}, ${d3.select(this).attr("cy")})`)

        tooltipText.text(`${d.percentage.toFixed(1)}%`)
        tooltipAmount.text(`$${d.amount.toFixed(2)}`)
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 4)
          .style("fill", "#394353")

        tooltip.style("opacity", 0)
      })

  }, [data])

  return (
    <div className="transaction-radar-chart">
      <svg ref={svgRef}></svg>
      {data.length > 0 && (
        <div className="chart-legend">
          {data.map((item, index) => (
            <div key={index} className="legend-item">
              <div className="legend-color"></div>
              <span className="legend-text">
                {item.category}: {item.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TransactionRadarChart