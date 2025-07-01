// Bad: Direct string concatenation
app.get('/users', (req, res) => {
    const userId = req.query.id;
    const query = `SELECT * FROM users WHERE id = ${userId}`;
    db.query(query, (err, results) => {
        res.json(results);
    });
});
// Bad: Direct insertion of user input
app.get('/welcome', (req, res) => {
    const name = req.query.name;
    res.send(`<h1>Welcome ${name}!</h1>`);
});

// Bad: Direct execution of user input
const { exec } = require('child_process');

app.post('/convert', (req, res) => {
    const filename = req.body.filename;
    exec(`convert ${filename} output.jpg`, (error, stdout) => {
        res.send('Conversion complete');
    });
});

// Good: Input validation and safe execution
const { spawn } = require('child_process');
const path = require('path');

app.post('/convert', (req, res) => {
    const filename = path.basename(req.body.filename); // Remove path traversal
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
        return res.status(400).send('Invalid filename');
    }
    
    const convert = spawn('convert', [filename, 'output.jpg']);
    convert.on('close', () => res.send('Conversion complete'));
});

// Bad: Direct file access
app.get('/file', (req, res) => {
    const filename = req.query.name;
    res.sendFile(`/uploads/${filename}`);
});

// Bad: Unsafe object merging
function merge(target, source) {
    for (let key in source) {
        if (typeof source[key] === 'object') {
            target[key] = merge(target[key] || {}, source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

const userInput = JSON.parse(req.body.data);
merge({}, userInput); // Dangerous!

// Bad: Catastrophic backtracking
const emailRegex = /^([a-zA-Z0-9])+@([a-zA-Z0-9])+\.([a-zA-Z0-9])+$/;

app.post('/validate-email', (req, res) => {
    const email = req.body.email;
    if (emailRegex.test(email)) {
        res.send('Valid email');
    } else {
        res.send('Invalid email');
    }
});

// Bad: Dynamic code execution
app.post('/calculate', (req, res) => {
    const expression = req.body.expression;
    const result = eval(expression); // Extremely dangerous!
    res.json({ result });
});