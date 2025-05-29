const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// 配置文件存储
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// 静态文件服务
app.use(express.static('public'));

// 文件上传接口
app.post('/api/upload', upload.array('files'), (req, res) => {
    res.json({
        success: true,
        message: '文件上传成功',
        files: req.files.map(file => ({
            name: file.originalname,
            size: file.size,
            path: file.path
        }))
    });
});

// 获取文件列表接口
app.get('/api/files', (req, res) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
        return res.json([]);
    }

    const files = fs.readdirSync(uploadDir).map(file => {
        const stats = fs.statSync(path.join(uploadDir, file));
        return {
            name: file,
            size: formatFileSize(stats.size),
            date: stats.mtime.toISOString().split('T')[0],
            path: path.join(uploadDir, file)
        };
    });

    res.json(files);
});

// 文件下载接口
app.get('/api/download/:filename', (req, res) => {
    const filePath = path.join('uploads/', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('文件不存在');
    }
});

// 删除文件接口
app.delete('/api/file/:filename', (req, res) => {
    const filePath = path.join('uploads/', req.params.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true, message: '文件删除成功' });
    } else {
        res.status(404).json({ success: false, message: '文件不存在' });
    }
});

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
