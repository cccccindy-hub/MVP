// OpenAI API Configuration
const config = {
    openaiApiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
    model: 'gpt-4-turbo-preview', // 或其他适合的模型
    maxTokens: 2000
};

module.exports = config; 