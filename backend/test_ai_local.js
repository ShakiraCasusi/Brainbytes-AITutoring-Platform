const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const aiService = require('./aiService');

async function run() {
  console.log('HUGGINGFACE_TOKEN exists:', !!process.env.HUGGINGFACE_TOKEN);
  console.log('HUGGINGFACE_TOKEN length:', process.env.HUGGINGFACE_TOKEN?.length);
  
  const result = await aiService.generateResponse('what is noun?');
  console.log('\nResult generated:');
  console.log(JSON.stringify(result, null, 2));
}

run().catch(console.error);
