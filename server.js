const logEvent = require('./logEvent');
const eventEmitter = require('events');
const fsPromise = require('fs').promises;
const http = require('http');
const path = require('path');
const fs = require('fs');

class Emitter extends eventEmitter {};
const myEmitter = new Emitter();
myEmitter.on('log', (msg, filename) => logEvent(msg, filename));
const port = process.env.PORT || 4000;

const serveFiles = async (filepath, contentType, response) => {
    try {
        
        const rawData = await fsPromise.readFile(
            filepath, 
            !contentType.includes('image') ? 'utf-8' : ''
        );

        const data = contentType === 'application/json'
            ? JSON.parse(rawData) : rawData;
        
        response.writeHead(
            contentType.includes('404') ? 404 : 200,
            { 
                'Content-Type': contentType 
            }
        );

        response.end(
            contentType === 'application/json' ? JSON.stringify(data) : data
        );
    } catch (error) {
        console.error(error);
        myEmitter.emit('log', `${error.name}: ${error.message}`, 'errorLog.txt');
        response.statusCode = 500;
        response.end();
    }
}

const server = http.createServer((req, res) => {

    console.log(req.url, req.method);
    myEmitter.emit('log', `${req.url}\t${req.method}`, 'reqLog.txt');
    const extention = path.extname(req.url);
    let contentType;

    switch(extention) {
        case '.css':
            contentType = 'text/css'
            break;
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case 'txt':
            contentType = 'text/plain';
            break;
        default:
            contentType = 'text/html';
    }


    let filepath = 
            contentType === 'text/html' && req.url === '/'
            ? path.join(__dirname, 'views', 'index.html')
            :  contentType === 'text/html' && req.url.slice(-1) === '/'
                ? path.join(__dirname, 'views', req.url, 'index.html')
                : contentType === 'text/html'
                    ? path.join(__dirname, 'views', req.url)
                    : path.join(__dirname, req.url);

    if (!extention && req.url.slice(-1) !== '/') {
        contentType += '.html';
    }

    const filePathExists = fs.existsSync(filepath);

    if (filePathExists) {
        serveFiles(filepath, contentType, res)
    } else {
        switch(path.parse(filepath).base) {
            case '/old-page.html':
                res.writeHead(301, { 'location': '/new-page.html' });
                res.end();
                break;
            case '/www-page.html':
                res.writeHead(301, { 'location': '/' });
                res.end();
                break;
            default:
                serveFiles(path.join(__dirname, 'views', '404.html'), 'text/html', res);
        }
    }
});
server.listen(port, () => console.log(`http://localhost:${port}`));