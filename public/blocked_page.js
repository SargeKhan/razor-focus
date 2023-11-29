function transformObject(obj, duration) {
    const result = {};

    for (const key in obj) {
        const [start, end] = key.split(':').map(Number);
        let currentTime = start;

        while (currentTime < end) {
            const nextTime = Math.min(currentTime + duration, end);
            const newKey = `${currentTime}:${nextTime}`;

            result[newKey] = {
                ...obj[key],
                startTime: currentTime,
                endTime: nextTime
            };

            currentTime = nextTime;
        }
    }

    return result;
}

const browserTabActivityMix = {
    '1692713886850:1692714366850': {
        tabId: 740833495,
        url: 'https://example.com/',
        startTime: 1692713886850,
        endTime: 1692714366850,
        state: 'focused'
    },
    '1692713887151:1692714187151': {
        tabId: 740833496,
        url: 'https://news.com/',
        startTime: 1692713887151,
        endTime: 1692714187151,
        state: 'distracted'
    },
    '1692713887452:1692714427452': {
        tabId: 740833497,
        url: 'https://socialmedia.com/',
        startTime: 1692713887452,
        endTime: 1692714427452,
        state: 'focused'
    },
    '1692713887753:1692714007753': {
        tabId: 740833498,
        url: 'https://shopping.com/',
        startTime: 1692713887753,
        endTime: 1692714007753,
        state: 'distracted'
    },
    '1692713888054:1692714368054': {
        tabId: 740833499,
        url: 'https://email.com/',
        startTime: 1692713888054,
        endTime: 1692714368054,
        state: 'neutral'
    },
    '1692713888655:1692714308655': {
        tabId: 740833500,
        url: 'https://games.com/',
        startTime: 1692713888655,
        endTime: 1692714308655,
        state: 'distracted'
    },
    '1692713888956:1692714188956': {
        tabId: 740833501,
        url: 'https://music.com/',
        startTime: 1692713888956,
        endTime: 1692714188956,
        state: 'focused'
    }
}
const TWO_MINUTES_IN_MS = 2 * 60 * 1000;
function splitIntoTwoMinuteChunks(data) {
    const result = {};

    for (const key in data) {
        const entry = data[key];
        const { startTime, endTime, tabId, url, state } = entry;
        let currentStartTime = startTime;
        let currentEndTime = Math.min(currentStartTime + TWO_MINUTES_IN_MS, endTime);

        while (currentStartTime < endTime) {
            const newKey = `${currentStartTime}:${currentEndTime}`;
            result[newKey] = {
                tabId,
                url,
                startTime: currentStartTime,
                endTime: currentEndTime,
                state
            };

            currentStartTime = currentEndTime;
            currentEndTime = Math.min(currentStartTime + TWO_MINUTES_IN_MS, endTime);
        }
    }

    return result;
}
function addDuration(tabActivity) {
    Object.keys(tabActivity).forEach(key => {
        tabActivity[key].duration = tabActivity[key].endTime - tabActivity[key].startTime
    })
}

function getTotalDuration(entries) {
    return entries.reduce((acc, curr) => acc + curr.duration, 0)
}

function generateLinePoints(entries) {
    const linePoints = [];
    let currentValue = 0;
    let index = 0
    const totalDurationInSeconds = getTotalDuration(entries) / 1000

    for (const key in entries) {

        const entry = entries[key];

        let adjustmentValue = 0;
        if (entry.state === "focused") {
            adjustmentValue = 1
        } else if (entry.state === "distracted") {
            adjustmentValue = -1;
        }

        currentValue = adjustmentValue;

        linePoints.push({
            y: currentValue,
            x: index / entries.length
        });
        index++;
    }

    return linePoints;
}

function sumDirectionUntilIndex(directions, index) {
    let sum = 0;
    for (i = 0; i < index; i++) {
        sum = directions[i].x + sum
    }
    return sum;
}

function calculateChangeInYDirection(currentDirection, currentPosition, lastDirection) {
    const isDirectionChanged = Math.abs(lastDirection + currentDirection) === 0
    const signMultiplier = currentDirection > 0 ? -1 : 1;
    if (currentDirection === 0) {
        return currentPosition / 2
    }
    if (isDirectionChanged && currentDirection < 0) {
        return signMultiplier * 55
    }
    if (isDirectionChanged && currentDirection > 0) {
        return signMultiplier * 55
    }
    return signMultiplier * 15;
}

function generateMilestonesFromDirections(directions) {
    var milestonesInPercentage = [];
    var yPercentage = 50; // start at the middle (50%)

    for (var i = 0; i < directions.length; i++) {
        const xPercentage = directions[i].x * 100

        // Adjust y based on direction
        if ((directions[i].y > 0 && yPercentage <= 100) || directions[i].y <= 0 && yPercentage > -1 || (directions[i].y == 0)) {
            yPercentage += calculateChangeInYDirection(directions[i].y, yPercentage, directions[i - 1]?.y); // Increase y value by 25%
        }

        // Ensure y stays within bounds
        yPercentage = Math.min(Math.max(yPercentage, 5), 95);

        milestonesInPercentage.push({
            x: xPercentage + '%',
            y: yPercentage + '%',
            image: "http://127.0.0.1:5500/html/break_red.jpeg",
        });
    }

    console.log('calculated milestones');
    console.log(milestonesInPercentage)
    return milestonesInPercentage;
}

function addLines(elementId, activity) {
    // Create SVG element

    const svg = d3.select(`#${elementId}`);
    activity = splitIntoTwoMinuteChunks(activity)

    addDuration(activity)
    // Usage:
    const element = document.getElementById(elementId);
    const rect = element.getBoundingClientRect();
    const widthInPixels = rect.width;
    const heightInPixels = rect.height;
    const width = +widthInPixels;
    const height = +heightInPixels - 10;
    const directions = generateLinePoints(Object.values(activity))


    const milestonesInPercentage = generateMilestonesFromDirections(directions);
    /* Sample data
    const milestones = [
      { x: '00%', y: '70%', image: "http://127.0.0.1:5500/html/break.jpeg" },
      { x: '10%', y: '60%', image: "http://127.0.0.1:5500/html/break.jpeg" },
      { x: '30%', y: '40%', image: "http://127.0.0.1:5500/html/break.jpeg" },
      { x: '50%', y: '35%', image: "http://127.0.0.1:5500/html/break.jpeg" },
      { x: '60%', y: '35%', image: "http://127.0.0.1:5500/html/break.jpeg" },
      { x: '70%', y: '40%', image: "http://127.0.0.1:5500/html/break.jpeg" },
      { x: '80%', y: '62%', image: "http://127.0.0.1:5500/html/break.jpeg" },
      { x: '90%', y: '70%', image: "http://127.0.0.1:5500/html/break.jpeg" }
    ];*/


    const milestones = milestonesInPercentage.map(milestone => ({
        ...milestone,
        x: width * parseFloat(milestone.x) / 100,
        y: height * parseFloat(milestone.y) / 100 + 5,
    }));
    // Draw curvy lines
    const line = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveCardinal);

    const path = svg.append("path")
        .datum(milestones)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "white");

    // // Add milestone images
    // svg.selectAll(".milestone")
    //   .data(milestones)
    //   .enter()
    //   .append("image")
    //   .attr("class", "milestone")
    //   .attr("xlink:href", d => d.image)
    //   .attr("x", d => d.x - 10) // Adjust positioning
    //   .attr("y", d => d.y - 10) // Adjust positioning
    //   .attr("width", 20)
    //   .attr("height", 20);


    const length = path.node().getTotalLength(); // Get line length
    path.attr("stroke-dasharray", length + " " + length)
        .attr("stroke-dashoffset", length)
        .transition()
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .delay(1500)
        .duration(1000)
}
addLines('thread', transformObject(browserTabActivityMix, 60000))
