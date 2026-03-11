const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Proxy API requests to backend
app.use('/auth/*', (req, res) => {
    const backendUrl = `http://127.0.0.1:9090${req.path}`;
    
    // Simple proxy - redirect to backend
    const options = {
        method: req.method,
        headers: req.headers
    };
    
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            options.body = body;
            fetch(backendUrl, options)
                .then(response => response.json())
                .then(data => res.json(data))
                .catch(err => res.status(500).json({ error: err.message }));
        });
    } else {
        fetch(backendUrl, options)
            .then(response => response.json())
            .then(data => res.json(data))
            .catch(err => res.status(500).json({ error: err.message }));
    }
});

app.use('/api/*', (req, res) => {
    const backendUrl = `http://127.0.0.1:9090${req.path}`;
    
    // Simple proxy - redirect to backend
    const options = {
        method: req.method,
        headers: req.headers
    };
    
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            options.body = body;
            fetch(backendUrl, options)
                .then(response => response.json())
                .then(data => res.json(data))
                .catch(err => res.status(500).json({ error: err.message }));
        });
    } else {
        fetch(backendUrl, options)
            .then(response => response.json())
            .then(data => res.json(data))
            .catch(err => res.status(500).json({ error: err.message }));
    }
});

// Serve index.html for all other routes (SPA routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
    console.log(`Spotify Wrapper Frontend running at http://127.0.0.1:${port}`);
    console.log(`Backend should be running at http://127.0.0.1:9090`);
});
