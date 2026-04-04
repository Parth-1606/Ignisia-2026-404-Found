const express = require('express');
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Smart local response when no Gemini key is set
function generateLocalResponse(message, context) {
  const msg = message.toLowerCase();

  // Hospital queries
  if (msg.includes('hospital') || msg.includes('bed') || msg.includes('icu') || msg.includes('capacity')) {
    return `Currently monitoring ${context.hospitalCount || 'multiple'} hospitals in the Pune network. ${context.activeDispatches || 0} active dispatches are in progress. Would you like me to check specific hospital bed availability or route to the nearest Level 1 Trauma Center?`;
  }

  // Ambulance queries
  if (msg.includes('ambulance') || msg.includes('unit') || msg.includes('fleet') || msg.includes('available')) {
    return `There are ${context.availableAmbulances || 0} ambulance units currently available in the fleet. Each unit is GPS-tracked and can be dispatched instantly via the SOS button or the triage form. Shall I check the nearest available unit to a specific location?`;
  }

  // SOS / Emergency queries
  if (msg.includes('sos') || msg.includes('emergency') || msg.includes('help') || msg.includes('dispatch')) {
    return `For immediate dispatch, use the red SOS button on the map — it sends the nearest ambulance to your GPS location instantly with no questions asked. For case-specific dispatch, fill in the triage form with vitals and click "Predict Needs & Route Unit."`;
  }

  // Triage queries
  if (msg.includes('triage') || msg.includes('severity') || msg.includes('critical') || msg.includes('vital')) {
    return `The AI triage engine classifies patients as Critical, Urgent, or Stable based on vitals (HR, BP, SpO2, GCS). Critical patients (GCS <8, SpO2 <90%) are auto-routed to Level 1 Trauma Centers with neuro and cath lab capabilities.`;
  }

  // Vision / Photo analysis
  if (msg.includes('photo') || msg.includes('vision') || msg.includes('camera') || msg.includes('image') || msg.includes('scene')) {
    return `The Vision AI module uses TensorFlow.js MobileNetV2 to analyze accident scene photos in real-time. Upload a photo via the "Scene Photo Analysis" panel — if a vehicle collision is detected, routing automatically overrides to the nearest Level 1 Trauma Center.`;
  }

  // Protocol queries
  if (msg.includes('protocol') || msg.includes('procedure') || msg.includes('guideline')) {
    return `Standard dispatch protocol: 1) Assess scene via photo or vitals, 2) AI classifies severity, 3) Constraint engine selects optimal hospital based on specialty + capacity + proximity, 4) Nearest unit dispatched. Mass Casualty Protocol (MCI) can be toggled from the header for multi-patient incidents.`;
  }

  // Greeting
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.match(/^(hi|hey|hello|sup|yo)\b/)) {
    return `Hello! I'm the Ignisia AI Dispatcher. I can help with dispatch status, hospital capacity checks, triage protocols, and emergency coordination. What do you need?`;
  }

  // Status queries
  if (msg.includes('status') || msg.includes('active') || msg.includes('current') || msg.includes('ongoing')) {
    return `System status: ${context.activeDispatches || 0} active dispatch${(context.activeDispatches || 0) !== 1 ? 'es' : ''} in progress, ${context.availableAmbulances || 0} ambulances on standby, ${context.hospitalCount || 0} hospitals online. All systems operational.`;
  }

  // Default intelligent response
  return `I can assist with: dispatch coordination, hospital capacity queries, triage protocols, fleet status, and emergency procedures. Currently tracking ${context.activeDispatches || 0} active incidents across ${context.hospitalCount || 0} hospitals. What specific information do you need?`;
}

router.post('/', async (req, res) => {
  try {
    const { messages, context } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Messages array is required' });
    }

    const lastUserMsg = messages[messages.length - 1]?.text || '';

    // If Gemini API key is set, use the real AI
    if (GEMINI_API_KEY) {
      try {
        const systemPrompt = `You are "Ignisia AI Dispatcher", an emergency medical dispatch assistant for the GoldenHour Dispatch platform in Pune, India. Keep responses concise (2-3 sentences max). You have real-time access to:
- ${context?.hospitalCount || 0} hospitals in the network
- ${context?.activeDispatches || 0} active dispatches in progress
- ${context?.availableAmbulances || 0} available ambulance units
${context?.selectedPatient ? `- Selected patient: ${context.selectedPatient.id}, Severity: ${context.selectedPatient.severity}, Symptoms: ${context.selectedPatient.symptoms}` : ''}
Answer questions about dispatch status, hospital capacity, triage advice, or emergency protocols. Be direct and actionable.`;

        const contents = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood. I am Ignisia AI Dispatcher, ready to assist with emergency dispatch coordination. How can I help?' }] },
        ];

        // Add conversation history (skip the initial greeting)
        for (const msg of messages.slice(1)) {
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
          }
        );

        const data = await geminiRes.json();
        const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (aiText) {
          return res.json({ success: true, response: aiText, model: 'gemini-2.0-flash' });
        }
      } catch (geminiErr) {
        console.error('Gemini API error, falling back to local:', geminiErr.message);
      }
    }

    // Fallback: Smart local response
    const localResponse = generateLocalResponse(lastUserMsg, context || {});
    return res.json({ success: true, response: localResponse, model: 'local-dispatch-ai' });

  } catch (err) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
