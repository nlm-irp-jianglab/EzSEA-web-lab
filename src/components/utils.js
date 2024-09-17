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
