const express = require('express');
const mysql = require('mysql2');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'testdb'
});

// VULNERABILITY 1: SQL Injection
app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    // BAD: Direct string concatenation - SQL injection vulnerability
    const query = `SELECT * FROM users WHERE id = ${userId}`;
    
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).send('Database error');
            return;
        }
        res.json(results);
    });
});

// VULNERABILITY 2: Cross-Site Scripting (XSS)
app.get('/welcome', (req, res) => {
    const name = req.query.name;
    // BAD: Direct output of user input - XSS vulnerability
    res.send(`<h1>Welcome ${name}!</h1>`);
});

// VULNERABILITY 3: Command Injection
app.post('/convert', (req, res) => {
    const filename = req.body.filename;
    // BAD: Direct execution of user input - Command injection vulnerability
    exec(`convert uploads/${filename} converted/output.jpg`, (error, stdout, stderr) => {
        if (error) {
            res.status(500).send('Conversion failed');
            return;
        }
        res.send('File converted successfully');
    });
});

// VULNERABILITY 4: Path Traversal
app.get('/download', (req, res) => {
    const file = req.query.file;
    // BAD: No path validation - Path traversal vulnerability
    const filePath = path.join(__dirname, 'uploads', file);
    
    res.download(filePath, (err) => {
        if (err) {
            res.status(404).send('File not found');
        }
    });
});

// VULNERABILITY 5: Unsafe File Read
app.get('/read-file', (req, res) => {
    const fileName = req.query.name;
    // BAD: Direct file access - Path traversal vulnerability
    fs.readFile(`./data/${fileName}`, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
            return;
        }
        res.send(data);
    });
});

// VULNERABILITY 6: NoSQL Injection (if using MongoDB)
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    
    // BAD: Direct object construction - NoSQL injection vulnerability
    const query = {
        username: username,
        password: password
    };
    
    // This would be vulnerable if using MongoDB
    console.log('Login attempt:', query);
    res.json({ message: 'Login processed' });
});

// VULNERABILITY 7: Eval/Code Injection
app.post('/calculate', (req, res) => {
    const expression = req.body.expression;
    
    try {
        // BAD: Using eval with user input - Code injection vulnerability
        const result = eval(expression);
        res.json({ result: result });
    } catch (error) {
        res.status(400).json({ error: 'Invalid expression' });
    }
});

// VULNERABILITY 8: LDAP Injection
app.get('/search-user', (req, res) => {
    const searchTerm = req.query.term;
    // BAD: Direct LDAP query construction - LDAP injection vulnerability
    const ldapFilter = `(&(objectClass=person)(cn=${searchTerm}))`;
    
    console.log('LDAP Filter:', ldapFilter);
    res.json({ filter: ldapFilter });
});

// VULNERABILITY 9: XML External Entity (XXE)
app.post('/parse-xml', (req, res) => {
    const xml2js = require('xml2js');
    const xmlData = req.body.xml;
    
    // BAD: Parsing XML without disabling external entities
    const parser = new xml2js.Parser({
        // Missing security options - XXE vulnerability
    });
    
    parser.parseString(xmlData, (err, result) => {
        if (err) {
            res.status(400).send('XML parsing error');
            return;
        }
        res.json(result);
    });
});

// VULNERABILITY 10: Hardcoded Secrets
const API_KEY = 'sk-1234567890abcdef'; // BAD: Hardcoded API key
const JWT_SECRET = 'my-super-secret-key'; // BAD: Hardcoded JWT secret

app.get('/api-data', (req, res) => {
    // Using hardcoded API key
    console.log('Using API key:', API_KEY);
    res.json({ message: 'API data retrieved' });
});

// Safe endpoint for comparison
app.get('/safe-welcome', (req, res) => {
    const name = req.query.name;
    // GOOD: Proper escaping
    const safeName = name ? name.replace(/[<>&"]/g, '') : 'Guest';
    res.send(`<h1>Welcome ${safeName}!</h1>`);
});

app.listen(port, () => {
    console.log(`Vulnerable server running at http://localhost:${port}`);
});

module.exports = app;