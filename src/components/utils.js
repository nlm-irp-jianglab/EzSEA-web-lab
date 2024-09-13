export const readFastaFromFile = async (path) => {
    return await fetch(path)
        .then(response => response.text())
        .catch(error => console.error('Error fetching file:', error));
}
