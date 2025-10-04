const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 文件上传配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

// 数据库连接
const db = mysql.createPool({
    host: 'localhost',
    user: 'choice_questions',
    password: 'zndxzdtdx66',
    database: 'choice_questions'
});

// ==================== 页面路由 ====================

// 处理根路径
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main-interface.html'));
});

// 处理游戏页面
app.get('/game-interface.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game-interface.html'));
});

// 自定义游戏页面路由
app.get('/learn', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'game-interface.html'));
});

// 处理管理员页面
app.get('/admin-interface-new.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-interface-new.html'));
});

// 自定义管理员页面路由
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-interface-new.html'));
});

// ==================== 用户API ====================

// 获取单词和选择题的完整题库
app.get('/api/questions/choice-bank', async (req, res) => {
    try {
        // 获取所有选择题
        const [choiceQuestions] = await db.execute(
            'SELECT * FROM choice_questions ORDER BY id'
        );
        
        // 获取所有单词闪卡
        const [flashcards] = await db.execute(
            'SELECT * FROM flashcards ORDER BY id'
        );
        
        res.json({
            choiceQuestions: choiceQuestions,
            flashcards: flashcards
        });
        
    } catch (error) {
        console.error('错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取完形填空的完整题库
app.get('/api/questions/cloze-bank', async (req, res) => {
    try {
        // 获取所有完形填空题
        const [clozeQuestions] = await db.execute(
            'SELECT * FROM cloze_questions ORDER BY id'
        );
        
        res.json({
            clozeQuestions: clozeQuestions
        });
        
    } catch (error) {
        console.error('错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ==================== 管理员API ====================

// 上传选择题Excel文件
app.post('/api/admin/upload/choice', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }
        
        // 读取Excel文件
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        // 处理数据并插入数据库
        for (const row of data) {
            // 忽略序号列，只处理需要的字段
            await db.execute(
                'INSERT INTO choice_questions (question, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?)',
                [row.question, row.option_a, row.option_b, row.option_c, row.option_d, row.correct_answer]
            );
        }
        
        res.json({ 
            message: '选择题上传成功',
            count: data.length 
        });
        
    } catch (error) {
        console.error('错误:', error);
        res.status(500).json({ error: '上传失败' });
    }
});

// 上传单词闪卡Excel文件
app.post('/api/admin/upload/flashcard', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }
        
        // 读取Excel文件
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        // 获取所有选择题数据，用于匹配
        const [choiceQuestions] = await db.execute(
            'SELECT id, question, option_a, option_b, option_c, option_d FROM choice_questions'
        );
        
        // 处理数据并插入数据库
        const uploadResults = [];
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            let questionId = null;
            let matchedQuestions = [];
            
            // 如果Excel中有question_id列，直接使用
            if (row.question_id) {
                questionId = parseInt(row.question_id);
            } else {
                // 通过搜索选择题中的选项来匹配question_id
                const matchResult = await findMatchingQuestionId(row, choiceQuestions);
                questionId = matchResult.questionId;
                matchedQuestions = matchResult.matchedQuestions;
            }
            
            await db.execute(
                'INSERT INTO flashcards (word, meaning, example, explanation, part_of_speech, question_id) VALUES (?, ?, ?, ?, ?, ?)',
                [row.word, row.meaning, row.example, row.explanation, row.part_of_speech, questionId]
            );
            
            // 记录上传结果
            uploadResults.push({
                word: row.word,
                questionId: questionId,
                matchedQuestions: matchedQuestions
            });
        }
        
        res.json({ 
            message: '单词闪卡上传成功',
            count: data.length,
            results: uploadResults
        });
        
    } catch (error) {
        console.error('错误:', error);
        res.status(500).json({ error: '上传失败' });
    }
});

// 辅助函数：通过搜索选择题选项来匹配question_id
async function findMatchingQuestionId(flashcardRow, choiceQuestions) {
    const word = flashcardRow.word;
    const matchingQuestions = [];
    
    // 遍历所有选择题，查找匹配的选项
    for (const question of choiceQuestions) {
        const options = [question.option_a, question.option_b, question.option_c, question.option_d];
        
        // 只检查单词是否匹配任何选项
        for (const option of options) {
            if (option && (
                option.toLowerCase().includes(word.toLowerCase()) ||
                word.toLowerCase().includes(option.toLowerCase()) ||
                option.toLowerCase() === word.toLowerCase()
            )) {
                matchingQuestions.push({
                    id: question.id,
                    question: question.question,
                    matchedOption: option
                });
                break; // 找到匹配就跳出内层循环，避免同一题目重复匹配
            }
        }
    }
    
    // 处理匹配结果
    if (matchingQuestions.length === 0) {
        return {
            questionId: null,
            matchedQuestions: []
        };
    } else {
        // 记录所有匹配的题目，返回第一个作为主要question_id
        console.log(`单词 "${word}" 匹配到 ${matchingQuestions.length} 个题目:`, 
            matchingQuestions.map(q => `题目${q.id}: ${q.matchedOption}`));
        
        return {
            questionId: matchingQuestions[0].id, // 使用第一个匹配的ID作为主要question_id
            matchedQuestions: matchingQuestions // 返回所有匹配的题目
        };
    }
}

// 上传完形填空Excel文件
app.post('/api/admin/upload/cloze', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }
        
        // 读取Excel文件
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        // 处理数据并插入数据库
        for (const row of data) {
            // 忽略序号列，只处理需要的字段
            await db.execute(
                'INSERT INTO cloze_questions (passage, correct_answers) VALUES (?, ?)',
                [row.passage, row.correct_answers]
            );
        }
        
        res.json({ 
            message: '完形填空上传成功',
            count: data.length 
        });
        
    } catch (error) {
        console.error('错误:', error);
        res.status(500).json({ error: '上传失败' });
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});
