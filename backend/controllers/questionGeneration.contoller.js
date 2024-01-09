const { TextServiceClient } = require("@google-ai/generativelanguage");
const { GoogleAuth } = require("google-auth-library");

const MODEL_NAME = "models/text-bison-001";
const API_KEY = "AIzaSyDHy7OwLjyeqv7G3-KZ2QDMZ95FqOXeoJ0";

const client = new TextServiceClient({
  authClient: new GoogleAuth().fromAPIKey(API_KEY),
});

// Fisher-Yates shuffle algorithm to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function generateRephrasedOutput(para) {
  const prompt = `Given paragraph ${para}, rephrase the paragraph`;
  try {
    const result = await client.generateText({
      model: MODEL_NAME,
      prompt: {
        text: prompt,
      },
    });
    const output = JSON.stringify(result[0]?.candidates?.[0]?.output, null, 2);
    // console.log(output)
    return output;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function splitSentences(text) {
  const sentencePattern = /([.!?])\s+(?=[A-Z])/g;
  const sentences = await text.split(sentencePattern);
  const shuffledSentences = shuffleArray(sentences.filter(sentence => sentence !== '.').map(sentence => sentence.replace(/"/g, '')));
  return shuffledSentences;
}

async function generateSentences(inputParagraph) {
  try {
    const output = await generateRephrasedOutput(inputParagraph);
    const sentences = await splitSentences(output);
    return sentences;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

async function getMcqQuestions(sentences) {
  const questionAnswer = [];
  for (const element of sentences) {
    const qa = await getQuestionAnswer(element);

    const [questionPart, answerPart] = qa.split('&');
    const question = questionPart.replace(/^["']|["']$/g, '').trim();
    const answer = answerPart.replace(/^["']|["']$/g, '').trim();
  
    const qaObject = {
      question: question,
      answer: answer,
    };
  
    questionAnswer.push(qaObject);
  }
  return questionAnswer;
}

async function getQuestionAnswer(context) {
  const prompt = `Context: "${context}" from given context please generate question and answer, and return like this question&answer just write the question and answer no need for titles and only use one "&" to separate question and answer and not any other special characters and keep the answers length short and not simple as well as not same ,try to create unique set of question ans answers`;
  try {
    const result = await client.generateText({
      model: MODEL_NAME,
      prompt: {
        text: prompt,
      },
    });
    const output = JSON.stringify(result[0]?.candidates?.[0]?.output, null, 2);
    return output;
  } catch (error) {
    console.error(error);
    return null;
  }
}


async function generateOptions(question, answer) {
    const prompt = `Context: "question :${question} and answer: ${answer} from given question and answer please generate three distractors ,all three distractors should be in one line and separated by & and return like this distractor1&distractor2&distractor3 just write the distractors no need for titles and only use one "&" to separate distractors and not any other special characters and length of distractors to be same as answer and not simple`;
    try {
        const result = await client.generateText({
          model: MODEL_NAME,
          prompt: {
            text: prompt,
          },
        });
        const output = JSON.stringify(result[0]?.candidates?.[0]?.output, null, 2);
        // console.log(output)
        return output;
      } catch (error) {
        console.error(error);
        return null;
      }
}

async function generateDistractorsUsingQuestionAndAnswer(questionAnswers) {
    const result = [];
    let cnt = 1;
    for(const element of questionAnswers) {
        const opt = await generateOptions(element.question,element.answer);
        const [opt1, opt2 ,opt3] = opt.split('&');
    
        const option1 = opt1.replace(/^["']|["']$/g, '').trim();
        const option2 = opt2.replace(/^["']|["']$/g, '').trim();
        const option3 = opt3.replace(/^["']|["']$/g, '').trim();
    
        const optionObject = [option1,option2,option3,element.answer];

        shuffleArray(optionObject);
    
        const resultObject = {
            id : cnt,
            question: element.question,
            answer: element.answer,
            options: optionObject,
            };
    
        result.push(resultObject);
            cnt++;
      }
    return result;
}

const generateQuestion = async (inputParagraph) => {
  try {
    const sentences = await generateSentences(inputParagraph);
    // console.log(sentences.length);
    const questionAnswers = await getMcqQuestions(sentences);

    const questionAnswersWithDistractors = await generateDistractorsUsingQuestionAndAnswer(questionAnswers);

    return questionAnswersWithDistractors;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

module.exports = { generateQuestion };
