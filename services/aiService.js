const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class AIService {
  static async generateStudyPlan(subject, level, preferences) {
    try {
      const prompt = `Create a personalized study plan for ${subject} at ${level} level. 
      Consider these preferences: ${JSON.stringify(preferences)}.
      Include specific topics, learning objectives, and suggested activities.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert educational assistant creating personalized study plans."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('AI service error:', error);
      throw new Error('Failed to generate study plan');
    }
  }

  static async createAccessibleContent(content, accessibilityNeeds) {
    try {
      const prompt = `Adapt the following content to be more accessible for someone with ${accessibilityNeeds}:
      ${content}
      Please provide the adapted content with appropriate modifications.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in creating accessible content for various needs."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('AI service error:', error);
      throw new Error('Failed to create accessible content');
    }
  }

  static async generateMemoryExercises(level, preferences) {
    try {
      const prompt = `Create memory exercises suitable for ${level} level.
      Consider these preferences: ${JSON.stringify(preferences)}.
      Include various types of exercises that can help improve memory.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in creating memory exercises and cognitive training activities."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('AI service error:', error);
      throw new Error('Failed to generate memory exercises');
    }
  }
}

module.exports = AIService; 