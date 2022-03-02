import { LightningElement } from 'lwc';
// D3 imports
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from 'lightning/platformResourceLoader';
import D3 from '@salesforce/resourceUrl/D3';

export default class D3GanttChart extends LightningElement {
    d3Init = false;

    svgWidth = 700;
    svgHeight = 350;

    renderedCallback() {
        if(this.d3Init)
            return;

        Promise.all([loadScript(this, D3 + '/d3.min.js')])
            .then(() => {
                this.d3Init = true;
                this.initD3();
            })
            .catch(error => {
                this.dispatchEvent(
                    console.log('error: ', error),
                    new ShowToastEvent({
                        title: 'Error loading D3',
                        message: error.message,
                        variant: 'error'
                    })
                );
            });
    }

    initD3(){
        // chart set up parameters
        const width = this.svgWidth;
        const height = this.svgHeight;
        const margin = {left: 40, top: 30, right: 40, bottom: 50}
        const getRatio = side => (margin[side] / width) * 100 + '%';

        const marginRatio = {
            left: getRatio('left'),
            top: getRatio('top'),
            right: getRatio('right'),
            bottom: getRatio('bottom')
        }


        // create container for gantt chart that includes margins and responsiveness
        const svg = d3.select(this.template.querySelector('div.d3'))
            .append('svg')
            .style('padding', marginRatio.top + ' ' + marginRatio.right + ' ' 
                            + marginRatio.bottom + ' ' + marginRatio.left + ' ')
            .attr('width', this.svgWidth)
            .attr('height', this.svgHeight)
            .attr('viewBox', [0, 0, this.svgWidth + margin.left + margin.right, this.svgHeight + margin.top + margin.bottom])
            .attr("style", "width: 100%; max-width: 700px; height: auto; height: intrinsic;");

        // sample data to display on chart
        let data = [
            {
                meeting: "Approval Meeting",
                type: "project",
                date: "03/01/2022",
                label: "Project Alpha",
                status: "approved"
            },
            {
                meeting: "Review Meeting",
                type: "project",
                date: "03/02/2022",
                label: "Project Beta",
                status: "proposed"
            },
            {
                meeting: "Project Review",
                type: "project",
                date: "03/03/2022",
                label: "Project Charlie",
                status: "review"
            },
            {
                meeting: "Reflection",
                type: "project",
                date: "03/02/2022",
                label: "Project Delta",
                status: "approved"
            },
            {
                meeting: "Planning Greet",
                type: "event",
                date: "03/04/2022",
                label: "Company Event",
                status: "in-process"
            },
            {
                meeting: "Onboarding",
                type: "project",
                date: "03/06/2022",
                label: "Project Echo",
                status: "pending"
            },
            {
                meeting: "Final Meeting",
                type: "project",
                date: "03/01/2022",
                label: "Project Zeta",
                status: "rejected"
            },
        ];

        // get array of categories to use in colorScale
        var categories = new Array();

        for (let i = 0; i < data.length; i++) {
            categories.push(data[i].status);
        }

        // make sure array contains only unique categories
        categories = checkUnique(categories);

        // create color scale based off of the categories array so each status will have a different color
        var colorScale = d3.scaleLinear()
            .domain([0, categories.length])
            .range(["#00B9FA", "#F95002"])
            .interpolate(d3.interpolateHcl);
        
        // create scale for the x-axis using sample data and add to svg tag
        var timeScale = d3.scaleBand()
            .domain(d3.map(data, function(d) { return d.date }))
            .range([0, width])
            .padding(0.2);

        
        var xAxis = d3.axisBottom()
            .scale(timeScale)
            .tickSize(-height,0,0)
            .tickSizeOuter(0);

        let grid = svg.append("g")
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

        grid.append('g')
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + (height) + ")")
            .call(xAxis)

        // set up and add the y scale for the y-axis
        const yScale = d3.scaleLinear().domain([0, data.length]).range([height - margin.top, 0]);

        grid.append("g")
            .attr("class", "y-axis")
            .attr("transform", "translate(0," + margin.top + ")")
            .call(d3.axisLeft(yScale).tickSize(0).tickFormat(function(d){
                if (d > 0 )
                    return "Task " + d;
                else
                    return;
            })
            .ticks(data.length))
            .call(grid => grid.select(".domain").remove());
        
        // create highlighted rectangles to act as a container for the task nodes
        var highlightRects = svg.append("g")
            .selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", function(d, i){ return yScale(i) - 5 })
            .attr("width", function(d){ return width + margin.left + margin.right })
            .attr("height", 40)
            .attr("stroke", "none")
            .attr("fill",  d => d3.rgb(colorScale(categories.indexOf(d.status))))
            .attr("opacity", 0.2)
            
        // group the tasks in data together
        var projects = svg
            .append('g')
            .attr("transform", "translate(" + margin.left + ", " + 0 + ")")
            .selectAll("this_is_empty")
            .data(data)
            .enter()

        // create rectangles for each task and chart them
        var rects = projects
            .append("rect")
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("x", (d,i) => timeScale(d.date))
            .attr("y", (d,i) => yScale(i))
            .attr("width", timeScale.bandwidth())
            .attr("height", 30)
            .attr("stroke", "none")
            .attr("fill", d => d3.rgb(colorScale(categories.indexOf(d.status))))
            .on("mouseover", onMouseOverRect)
            //.on("mousemove", onMouseMove)
            .on("mouseout", onMouseOut);
        
        // add text to each of the created rectangles with the task name
        var rectText = projects.append("text")
            .text(d => d.label)
            .attr("x", d => timeScale(d.date) + timeScale.bandwidth()/2)
            .attr("y", (d,i) => yScale(i) + 20)
            .attr("font-size", 12)
            .attr("text-anchor", "middle")
            .attr("text-height", 30)
            .attr("fill", "#fff")
            .on("mouseover", onMouseOverText)
            .on("mouseout", onMouseOut);


        // tool tip set up for future manipulation
        const tooltip = d3.select(this.template.querySelector('.d3'))
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style('font-size', '10px');

        // tool tip event when mouse hovers over any rectangle
        function onMouseOverRect (e, d) {
            tooltip
                .transition()
                .duration(100)
                .style("opacity", .9);
            tooltip
                .html(`<div>Task: ${d.label}</br>Date: ${d.date}</br>Type: ${d.type}</br>Meeting: ${d.meeting}</br>Status: ${d.status}</div`)
                .style("left", (this.x.animVal.value + this.width.animVal.value/2)*.81 + "px")
                .style("top", (this.y.animVal.value + 25)*.81 + "px")
                .style("display", "block")
        }

        // tool tip event when mouse hovers over text in a rectangle
        function onMouseOverText (e, d) {
            tooltip
                .transition()
                .duration(100)
                .style("opacity", .9);
            tooltip
                .html(`<div>Task: ${d.label}</br>Date: ${d.date}</br>Type: ${d.type}</br>Meeting: ${d.meeting}</br>Status: ${d.status}</div`)
                .style("left", (this.x.animVal.getItem(this).value)*.81 + "px")
                .style("top", (this.y.animVal.getItem(this).value + 5)*.81 + "px")
                .style("display", "block")
        }

        function onMouseOut () {
            tooltip
                .transition()
                .duration(200)
                .style('opacity', 0)
        }


        // function to ensure array contains only unique values
        function checkUnique(arr) {
            var hash = {}, result = [];
            for ( var i = 0, l = arr.length; i < l; ++i ) {
                if ( !hash.hasOwnProperty(arr[i]) ) {
                    hash[ arr[i] ] = true;
                    result.push(arr[i]);
                }
            }
            return result;
        }
    }
}