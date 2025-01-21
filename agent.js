import 'dotenv/config'

import OpenAI from "openai";
import { createAppoinment, availableServices, availableSlots } from "./tools.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    // temperature: 0
});

async function createCalendarEvent(event) {
    return { message: await createAppoinment(event) };
}
const tools = [
    {
        type: "function",
        function: {
            name: "createCalendarEvent",
            description: "Create an appointment. book service using this tool.",
            parameters: {
                type: "object",
                properties: {
                    service_name: { type: "string" },
                    price: { type: "string" },
                    date: { type: Date, description: "Date of the appointment(ISO 8601 date)" },
                    time: { type: "string", description: "Time of appointment in 24-hour format" },
                    name: { type: "string", description: "Name of the user" },
                    phone: { type: "string", description: "Phone number of the user" }
                },
                required: ["service_name", "price", "date", "time", "name", "phone"],
            },
        }
    },
    {
        type: "function",
        function: {
            name: "availableServices",
            description: "List all the services provided by service provider.",
        }
    },
    {
        type: "function",
        function: {
            name: "availableSlots",
            description: "Check for available slots for the given date.",
            parameters: {
                type: "object",
                properties: {
                    date: { type: Date, description: "Date to check for available slots" }
                },
                required: ["date"],
            },
        }
    }
];
const availableTools = {
    createCalendarEvent, availableServices, availableSlots
};

let SYSTEM_PROMPT = `
    You are a helpful appointment/booking assistant for a beauty and wellness center. Guide users through the booking process in a friendly and professional tone.
    
    INSTRUCTIONS:
        Greet the User: Start with a polite greeting and ask how you can assist them at 'beauty and wellness center'.
        
        Service Selection: 
          Format services in a html list.
          Ask the user to choose one.

        If the user provides an ambiguous date or time, ask for clarification.
        Current Date and Time: ${new Date().toString()}
        Business Hours: Monday to Friday, 9 AM to 6 PM.
        Unavailable Days: Saturday and Sunday.
        
        If any information is missing, ask specific follow-up questions to clarify (e.g., "What time should I schedule the meeting?" or "Please provide name and phone number to book appoinment?").
        Once all details are gathered, confirm with the user before scheduling an appoinment.

    Make the interaction friendly and ensure the user feels comfortable throughout the process.

    EXAMPLES:
        User: "Hi, I'd like to book a manicure this friday."
        thought: if current date is 21st tuesday, this friday will be 24th.
        Assistant: "Great! What time should I schedule the appointment for?"
        ...
`;
const messages = [
    {
        role: "system",
        content: SYSTEM_PROMPT
    }
];


async function agent(input) {
    messages.push(input);
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        tools: tools,
    });
    const { finish_reason, message } = response.choices[0];
    if (finish_reason === "tool_calls" && message.tool_calls) {
        const functionName = message.tool_calls[0].function.name;
        const functionToCall = availableTools[functionName];
        const functionArgs = JSON.parse(message.tool_calls[0].function.arguments);
        const functionResponse = await functionToCall(functionArgs);
        return agent({
            role: "function",
            name: functionName,
            content: `
                The result of the last function was: ${JSON.stringify(
                functionResponse
            )}
                `,
        });
    } else {
        messages.push(response.choices[0].message);
    }
    return response.choices[0].message;
}


export default agent;