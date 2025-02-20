import ical from 'ical-generator';
import axios from 'axios';
import { v4 } from 'uuid';

function jsonToIcal(data) {
    console.log("JSON data generated by AI - ", data)
    const { service_name, price, date, time, name, phone } = data;

    // Parse date and time into a JavaScript Date object
    const eventStart = new Date(`${date}T${time}:00`);
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000); // Assuming a 1-hour duration

    // Create the calendar
    const calendar = ical({ name: 'AI Booking agent' });

    // Add the event to the calendar
    calendar.createEvent({
        start: eventStart,
        end: eventEnd,
        summary: `${service_name} - ${price}`,
        description: `Service booked by ${name}. Contact: ${phone}`
    });

    // Save the calendar to an ICS file
    return calendar.toString();
}

async function createAppoinment(data) {
    console.log("Tool [createAppoinment] called");
    try {
        // Read the ICS file
        const icsData = jsonToIcal(data);

        const id = v4();
        const USER = process.env.EMAIL;
        const PASSWORD = process.env.PASSWORD;
        const CALENDAR_HOST = process.env.CALENDAR_HOST;
        const calendarUrl = `${CALENDAR_HOST}/calendars/users/${USER}/calendar/${id}.ics`;

        // Ensure necessary headers
        const headers = {
            'Content-Type': 'text/calendar',
            'User-Agent': 'Node.js Calendar Client',
            'Authorization': 'Basic ' + Buffer.from(`${USER}:${PASSWORD}`).toString('base64')
        };
        // Send PUT request
        const response = await axios.put(calendarUrl, icsData, {
            headers: headers,
        });
        console.log("Calendar API response - ", response.status);
        return "Appointment created.";
    } catch (error) {
        console.error('Failed to upload ICS file:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return error.message
    }
}

async function availableServices() {
    console.log("Tool [availableServices] called");
    // Present the available services when asked.
    return [
        { service: "Manicure with Paraffin Treatment", price: "€35" },
        { service: "Anti-Aging Facial Treatment with Mask", price: "€155" },
        { service: "Eyebrow Correction", price: "€65" },
        { service: "threading", price: "€20" }
    ];
}

async function availableSlots(date) {
    console.log("Tool [availableSlots] called");
    // Check for available slots for the given date.
    return "Available slots for the selected date are 10:00 AM, 2:00 PM, and 4:00 PM.";
}

export { createAppoinment, availableServices, availableSlots };