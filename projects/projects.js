import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
  projectsTitle.textContent = `${projects.length} Projects`;
}

let query = '';
let selectedIndex = -1;
let selectedYear = null;
const searchInput = document.querySelector('.searchBar');

function getProjectsMatchingQuery() {
  return projects.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function getVisibleProjects() {
  const projectsMatchingQuery = getProjectsMatchingQuery();

  if (selectedYear === null) {
    return projectsMatchingQuery;
  }

  return projectsMatchingQuery.filter((project) => project.year === selectedYear);
}

function updateSelectedYear(index, data) {
  selectedIndex = selectedIndex === index ? -1 : index;
  selectedYear = selectedIndex === -1 ? null : data[selectedIndex].label;

  renderProjects(getVisibleProjects(), projectsContainer, 'h2');
  renderPieChart(getProjectsMatchingQuery());
}

function renderPieChart(projectsGiven) {
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  const data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);
  const arcs = arcData.map((d) => arcGenerator(d));
  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');

  selectedIndex =
    selectedYear === null ? -1 : data.findIndex((d) => d.label === selectedYear);

  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  arcs.forEach((arc, idx) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx))
      .attr('class', idx === selectedIndex ? 'selected' : '')
      .on('click', () => {
        updateSelectedYear(idx, data);
      });
  });

  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', `legend-item${idx === selectedIndex ? ' selected' : ''}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        updateSelectedYear(idx, data);
      });
  });
}

renderPieChart(getProjectsMatchingQuery());

searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  renderProjects(getVisibleProjects(), projectsContainer, 'h2');
  renderPieChart(getProjectsMatchingQuery());
});
