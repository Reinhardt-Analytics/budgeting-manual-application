import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import budgetDataTemplate from '../data/budgetData.json';
import './budget-creation.css';

export default function Dashboard() {
  const [budgetData, setBudgetData] = useState(() => {
    try {
      const savedData = localStorage.getItem('budgetData');
      return savedData ? JSON.parse(savedData) : { ...budgetDataTemplate };
    } catch (error) {
      return { ...budgetDataTemplate };
    }
  });
  const svgRef = useRef();

  useEffect(() => {
    // Prepare chart data for D3 radar chart
    const budgetEntries = Object.entries(budgetData.budgets);
    const allCategories = Object.keys(budgetData.budgets);
    const data = allCategories.map(category => {
      const amount = budgetData.budgets[category];
      const numericAmount = parseFloat(amount) || 0;
      return {
        category: category,
        percentage: numericAmount,
        amount: numericAmount
      };
    });
    const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);
    const normalizedData = data.map(d => ({
      ...d,
      normalizedValue: totalAmount > 0 ? (d.amount / totalAmount) * 100 : 0
    }));
    const maxPercentage = Math.max(...normalizedData.map(d => d.normalizedValue));
    const maxScale = Math.ceil(maxPercentage / 10) * 10 || 10;
    const angleSlice = (Math.PI * 2) / (normalizedData.length || 1);
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const width = 400 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    const radius = Math.min(width, height) / 2;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);
    const container = svg
      .append('g')
      .attr('transform', `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`);
    const rScale = d3.scaleLinear().range([0, radius]).domain([0, maxScale]);
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const levelRadius = (radius / levels) * level;
      container.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', levelRadius)
        .style('fill', 'none')
        .style('stroke', 'rgba(128, 128, 128, 0.3)')
        .style('stroke-opacity', 0.3)
        .style('stroke-width', '1px');
      if (level < levels) {
        container.append('text')
          .attr('x', 4)
          .attr('y', -levelRadius)
          .attr('dy', '0.4em')
          .style('font-size', '10px')
          .style('fill', '#9ca3af')
          .text(`${(maxScale / levels) * level}%`);
      }
    }
    normalizedData.forEach((d, i) => {
      container.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', radius * Math.cos(angleSlice * i - Math.PI / 2))
        .attr('y2', radius * Math.sin(angleSlice * i - Math.PI / 2))
        .style('stroke', 'rgba(128, 128, 128, 0.3)')
        .style('stroke-opacity', 0.3)
        .style('stroke-width', '1px');
    });
    const radarLine = d3.lineRadial()
      .angle((d, i) => angleSlice * i)
      .radius(d => rScale(d.normalizedValue))
      .curve(d3.curveLinearClosed);
    container.append('path')
      .datum(normalizedData)
      .attr('d', radarLine)
      .style('fill', '#394353')
      .style('fill-opacity', 0.2)
      .style('stroke', '#394353')
      .style('stroke-width', '2px');
    container.selectAll('.radarCircle')
      .data(normalizedData)
      .enter().append('circle')
      .attr('class', 'radarCircle')
      .attr('r', 4)
      .attr('cx', (d, i) => rScale(d.normalizedValue) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('cy', (d, i) => rScale(d.normalizedValue) * Math.sin(angleSlice * i - Math.PI / 2))
      .style('fill', '#394353')
      .style('stroke', 'white')
      .style('stroke-width', '2px');
    container.selectAll('.radarLabel')
      .data(normalizedData)
      .enter().append('text')
      .attr('class', 'radarLabel')
      .attr('x', (d, i) => (radius + 20) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (d, i) => (radius + 20) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .style('fill', 'var(--text-color)')
      .style('cursor', 'help')
      .style('text-anchor', (d, i) => {
        const angle = (angleSlice * i) * (180 / Math.PI);
        return angle > 90 && angle < 270 ? 'end' : 'start';
      })
      .text((d, i) => {
        const romanNumerals = [
          'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'IIX', 'IX', 'X'
        ];
        return romanNumerals[i] || String(i + 1);
      })
      .append('title')
      .text(d => d.category);
  }, [budgetData]);

  return (
    <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}
