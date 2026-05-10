require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_DEV = process.env.NODE_ENV !== 'production';

// CORS setup
const corsOptions = {
    origin: IS_DEV ? '*' : ['https://www.complexnumber.shop', 'http://www.complexnumber.shop', /\.vercel\.app$/]
};
app.use(cors(corsOptions));

// Parsing JSON
app.use(express.json());

// Serving static frontend files (only if not running on Vercel)
if (!process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, '.')));
}

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Nodemailer Setup
let transporter;
if (IS_DEV) {
    nodemailer.createTestAccount((err, account) => {
        if (err) return console.error('Failed to create a testing account. ' + err.message);
        transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: { user: account.user, pass: account.pass }
        });
        console.log('Ethereal Email account configured for testing.');
    });
} else {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

// Routes
app.post('/api/auth/signup', async (req, res) => {
    const { email, phone, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    
    // Check if email exists
    const { data: existing } = await supabase.from('members').select('id').eq('email', email).single();
    if (existing) {
        return res.status(400).json({ error: '이미 가입된 이메일입니다.' });
    }

    const { data, error } = await supabase
        .from('members')
        .insert([{ email, phone, password }])
        .select();

    if (error) {
        console.error('Supabase Error:', error);
        return res.status(500).json({ error: '서버 데이터베이스 에러' });
    }
    
    res.json({ success: true, memberId: data[0]?.id });
});

app.post('/api/auth/reset-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { data: user, error: fetchErr } = await supabase.from('members').select('id').eq('email', email).single();
    
    if (fetchErr || !user) {
        return res.status(404).json({ error: '해당 이메일로 가입된 계정을 찾을 수 없습니다.' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const { error: updateErr } = await supabase.from('members').update({ password: tempPassword }).eq('id', user.id);

    if (updateErr) {
        return res.status(500).json({ error: '비밀번호 재설정 실패' });
    }

    const mailOptions = {
        from: '"SIR. Shopping Mall" <noreply@complexnumber.shop>',
        to: email,
        subject: '[SIR.] 임시 비밀번호가 발급되었습니다.',
        text: `임시 비밀번호는 다음과 같습니다: ${tempPassword}\n\nhttps://www.complexnumber.shop/ 에 로그인한 후 비밀번호를 변경해주세요.`,
        html: `
            <h2>[SIR.] 임시 비밀번호 안내</h2>
            <p>회원님의 임시 비밀번호는 <b>${tempPassword}</b> 입니다.</p>
            <p><a href="https://www.complexnumber.shop/">complexnumber.shop</a> 에 로그인하여 반드시 비밀번호를 변경해주세요.</p>
        `
    };

    if (!transporter) return res.status(500).json({ error: '메일 서버가 아직 준비되지 않았습니다.' });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return res.status(500).json({ error: '이메일 발송 실패' });
        
        if (IS_DEV) {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            res.json({ success: true, devMode: true, previewUrl: nodemailer.getTestMessageUrl(info), tempPassword });
        } else {
            res.json({ success: true });
        }
    });
});

app.get('/api/members', async (req, res) => {
    const { data, error } = await supabase
        .from('members')
        .select('id, email, phone, marketing, status, joinDate')
        .order('id', { ascending: false });

    if (error) {
        console.error('Supabase Error:', error);
        return res.status(500).json({ error: 'Database error' });
    }
    res.json(data);
});

// Settings API (Notices, Menus, Footer, Perks)
app.get('/api/settings', async (req, res) => {
    const { data, error } = await supabase
        .from('site_settings')
        .select('settings_data')
        .eq('id', 1)
        .single();
        
    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Supabase Error (get settings):', error);
        return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(data ? data.settings_data : {});
});

app.post('/api/settings', async (req, res) => {
    const settingsData = req.body;
    
    // Check if row 1 exists
    const { data: existing } = await supabase.from('site_settings').select('id').eq('id', 1).single();
    
    let error;
    if (existing) {
        const result = await supabase.from('site_settings').update({ settings_data: settingsData, updated_at: new Date() }).eq('id', 1);
        error = result.error;
    } else {
        const result = await supabase.from('site_settings').insert([{ id: 1, settings_data: settingsData }]);
        error = result.error;
    }
    
    if (error) {
        console.error('Supabase Error (save settings):', error);
        return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ success: true });
});

// Products API
app.get('/api/products', async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .select('product_data')
        .eq('id', 1)
        .single();
        
    if (error && error.code !== 'PGRST116') {
        console.error('Supabase Error (get products):', error);
        return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(data ? data.product_data : []);
});

app.post('/api/products', async (req, res) => {
    const productsData = req.body;
    
    const { data: existing } = await supabase.from('products').select('id').eq('id', 1).single();
    
    let error;
    if (existing) {
        const result = await supabase.from('products').update({ product_data: productsData, created_at: new Date() }).eq('id', 1);
        error = result.error;
    } else {
        const result = await supabase.from('products').insert([{ id: 1, product_data: productsData }]);
        error = result.error;
    }
    
    if (error) {
        console.error('Supabase Error (save products):', error);
        return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ success: true });
});

// Vercel Serverless를 위한 모듈 내보내기. Vercel 환경이 아닐 때만 listen.
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running in ${IS_DEV ? 'development' : 'production'} mode on http://localhost:${PORT}`);
    });
}

module.exports = app;
