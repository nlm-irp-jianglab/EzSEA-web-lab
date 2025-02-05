export const readFastaFromFile = async (path) => {
    return await fetch(path)
        .then(response => response.text())
        .catch(error => console.error('Error fetching file:', error));
}

// Fetchs a local fasta file and reads sequences into a dictionary
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
            ancestoral_node: item.ancestral_node,
            descendant_node: item.descendant_node,
            leaves: item.leaves,
        }
    });
    return parsedData;
}

// Calculate the entropy of a multiple sequence alignment given as a fasta string
export const calcEntropyFromMSA = async (msa) => {
    const sequences = Object.values(await fastaToDict(msa));
    const numSequences = sequences.length;
    const seqLength = sequences[0].length;
    const entropy = Array(seqLength).fill(0);

    for (let i = 0; i < seqLength; i++) {
        const column = sequences.map(seq => seq[i]);
        const counts = column.reduce((acc, aa) => {
            acc[aa] = (acc[aa] || 0) + 1;
            return acc;
        }, {});
        const freqs = Object.values(counts).map(count => count / numSequences);
        entropy[i] = freqs.reduce((acc, freq) => acc - freq * Math.log2(freq), 0);
    }

    return entropy;
}

// Function to map entropy values to heatmap colors
export const mapEntropyToColors = async (entropyArray) => {
    const maxEntropy = Math.log2(20);  // Theoretical max entropy for amino acids (log2(20) ~ 4.32)
    const minEntropy = 0;              // Minimum entropy is 0

    // Helper function to normalize values between 0 and 1
    const normalize = (value, min, max) => (value - min) / (max - min);

    // Function to interpolate colors based on normalized value
    const interpolateColor = (value) => {
        // Low entropy, maroon to high entropy, cyan
        const colorStops = [
            { r: 160, g: 36, b: 96 },
            { r: 240, g: 125, b: 171 },
            { r: 250, g: 201, b: 222 },
            { r: 252, g: 237, b: 244 },
            { r: 255, g: 255, b: 255 },
            { r: 234, g: 255, b: 255 },
            { r: 214, g: 255, b: 255 },
            { r: 140, g: 255, b: 255 },
            { r: 17, g: 200, b: 209 }
        ];

        // Normalize value to a position in the color stop range
        const segment = 1 / (colorStops.length - 1);
        const index = Math.min(Math.floor(value / segment), colorStops.length - 2);
        const localValue = (value - index * segment) / segment;

        const r = Math.round(colorStops[index].r + (colorStops[index + 1].r - colorStops[index].r) * localValue);
        const g = Math.round(colorStops[index].g + (colorStops[index + 1].g - colorStops[index].g) * localValue);
        const b = Math.round(colorStops[index].b + (colorStops[index + 1].b - colorStops[index].b) * localValue);

        return `0x${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    };

    // Normalize entropies and map to colors
    const colorArray = entropyArray.map(entropy => {
        const normalizedValue = normalize(entropy, minEntropy, maxEntropy);
        return interpolateColor(normalizedValue);
    });

    // Get rgb values for 9 evenly spaced values between 0 and 1
    // const colorStops = Array.from({ length: 9 }, (_, i) => i / 8).map(interpolateColor);
    // console.log(colorStops);

    return colorArray;
};

export const jsonToFasta = (jsonObject) => {
    let fastaContent = '';

    // Iterate over each key-value pair in the JSON
    for (const [header, sequence] of Object.entries(jsonObject)) {
        // Construct FASTA format: Header starts with ">", followed by the sequence
        fastaContent += `>${header}\n${sequence}\n`;
    }

    return fastaContent;
};

export const calcGapOffsetArr = (faString) => {
    var gapOffsetArr = new Array(faString.length);
    var gaps = 0;

    // Iterate through string and increment gaps if encounters "-", else set current index in gapOffsetArr to gaps value
    for (let i = 0; i < faString.length; i++) {
        if (faString[i] === "-") {
            gaps++;
            gapOffsetArr[i] = -1;
        } else {
            gapOffsetArr[i] = gaps;
        }
    }

    return gapOffsetArr;
}

export const calcStructToLogoMap = (gappedFaString) => {
    var structToLogoMapArr = [];

    for (let i = 0; i < gappedFaString.length; i++) {
        if (gappedFaString[i] !== "-") {
            structToLogoMapArr.push(i);
        }
    }

    return structToLogoMapArr;
}