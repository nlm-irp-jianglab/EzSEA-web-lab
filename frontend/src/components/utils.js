export const readFastaFromFile = async (path) => {
    return await fetch(path)
        .then(response => response.text())
        .catch(error => console.error('Error fetching file:', error));
}

export const readFastaToDict = async (path) => {
    try {
        const fastaContent = await fetch(path).then(response => response.text());
        const fastaDict = {};
        let currentHeader = null;
        let currentSequence = [];

        const lines = fastaContent.split('\n');

        lines.forEach(line => {
            line = line.trim();

            if (line.startsWith('>')) {
                // If there's a current header, save the accumulated sequence before starting a new one
                if (currentHeader) {
                    fastaDict[currentHeader] = currentSequence.join('');
                }

                // Set the new header (excluding the '>')
                currentHeader = line.slice(1).split(' ')[0]; // Take only the part before space
                currentSequence = [];
            } else if (currentHeader) {
                // Accumulate sequence lines
                currentSequence.push(line);
            }
        });

        // Add the last sequence to the dictionary after looping through the lines
        if (currentHeader) {
            fastaDict[currentHeader] = currentSequence.join('');
        }

        return fastaDict;
    } catch (error) {
        console.error('Error fetching file:', error);
        return null;
    }
};

export const fastaToDict = async (fastaContent) => {
    const fastaDict = {};
    const lines = fastaContent.split('\n');
    let currentHeader = null;
    
    lines.forEach(line => {
        // Check if the line is a header (starts with `>`)
        if (line.startsWith('>')) {
            currentHeader = line.slice(1).trim(); // Remove `>` and trim spaces
            fastaDict[currentHeader] = ''; // Initialize sequence for this header
        } else if (currentHeader) {
            // Append the line to the current header's sequence
            fastaDict[currentHeader] += line.trim(); // Remove any spaces or newlines
        }
    });
    
    return fastaDict;
};

// TODO Parse annotations, add colors
export const addRingAnnotation = async (element, annotation) => { // attach rect to element, annotation is csv of annotations
    const node_label = element.select("text");
    const currentTransform = node_label.attr("transform");
    const translateRegex = /translate\s*\(\s*([-\d.]+,0)/;
    const currX = currentTransform.match(translateRegex)[1];
    let adjustX = 0;
    let shift = 0;
    let direction = 0;
    if (parseFloat(currX) < 0) {
        adjustX = -80; // Must account for size of the rect
        shift = -10;
    } else {
        shift = 10;
        adjustX = 70;
    }
    let newTransform = currentTransform.replace(translateRegex, `translate(${parseFloat(currX) + adjustX}, -5`);
    var annotations = element.append("g").attr("transform", newTransform);
    annotations.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", "red");
    annotations.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", "green")
        .attr("transform", `translate(${shift}, 0)`);
}

export const parseNodeData = async (nodeData) => {    
    const parsedData = {};
    nodeData.forEach(item => {
        parsedData[item.node] = {
            differing_residues: item.differing_residues,
            score: item.score,
        }
    });
    return parsedData;
}
