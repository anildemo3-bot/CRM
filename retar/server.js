const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3005;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Explicit route for the download
app.get('/download', (req, res) => {
    const file = path.join(__dirname, 'public', 'crm.zip');
    res.download(file, 'crm.zip', (err) => {
        if (err) {
            console.error('Error downloading file:', err);
            res.status(500).send('Could not download file.');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
