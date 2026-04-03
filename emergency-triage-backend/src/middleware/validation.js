const Joi = require('joi');



const patientVitalsSchema = Joi.object({
  incident_id: Joi.string().max(100).optional(),


  age: Joi.number().integer().min(0).max(120).optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'unknown').optional(),
  weight_kg: Joi.number().min(0).max(400).optional(),


  heart_rate: Joi.number().integer().min(0).max(300).required()
    .messages({ 'any.required': 'Heart rate is required' }),
  systolic_bp: Joi.number().integer().min(0).max(300).required()
    .messages({ 'any.required': 'Systolic blood pressure is required' }),
  diastolic_bp: Joi.number().integer().min(0).max(200).optional(),
  respiratory_rate: Joi.number().integer().min(0).max(60).required()
    .messages({ 'any.required': 'Respiratory rate is required' }),
  spo2: Joi.number().integer().min(0).max(100).required()
    .messages({ 'any.required': 'SpO2 is required' }),
  temperature: Joi.number().min(25).max(45).optional(),
  gcs_score: Joi.number().integer().min(3).max(15).required()
    .messages({ 'any.required': 'GCS score is required' }),
  blood_glucose: Joi.number().min(0).max(1000).optional(),


  symptoms: Joi.array().items(Joi.string().max(100)).max(20).optional(),
  mechanism_of_injury: Joi.string().max(255).optional(),
  chief_complaint: Joi.string().max(500).optional(),


  incident_latitude: Joi.number().min(-90).max(90).required()
    .messages({ 'any.required': 'Incident latitude is required' }),
  incident_longitude: Joi.number().min(-180).max(180).required()
    .messages({ 'any.required': 'Incident longitude is required' }),
  incident_address: Joi.string().max(500).optional(),


  mce_id: Joi.string().max(100).optional(),
});

const batchDispatchSchema = Joi.object({
  mce_id: Joi.string().max(100).required(),
  description: Joi.string().max(500).optional(),
  patients: Joi.array()
    .items(patientVitalsSchema)
    .min(2)
    .max(100)
    .required()
    .messages({ 'any.required': 'Patient list is required for batch dispatch' }),
});



const hospitalCapacityUpdateSchema = Joi.object({
  icu_beds_available: Joi.number().integer().min(0).optional(),
  ventilators_available: Joi.number().integer().min(0).optional(),
  current_load_percent: Joi.number().integer().min(0).max(100).optional(),
  is_on_diversion: Joi.boolean().optional(),
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });



const rerouteSchema = Joi.object({
  reason: Joi.string().max(255).required(),
  current_latitude: Joi.number().min(-90).max(90).optional(),
  current_longitude: Joi.number().min(-180).max(180).optional(),
});


const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      })),
    });
  }
  req.body = value;
  next();
};

module.exports = {
  validate,
  patientVitalsSchema,
  batchDispatchSchema,
  hospitalCapacityUpdateSchema,
  rerouteSchema,
};
