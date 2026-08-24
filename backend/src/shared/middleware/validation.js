export const validateBody = (rules) => {
  return (req, res, next) => {
    for (const [field, validators] of Object.entries(rules)) {
      const val = req.body[field];
      if (validators.required && (val === undefined || val === null || val === '')) {
        return res.status(400).json({ error: `Field '${field}' is required.` });
      }
      if (val !== undefined && val !== null && val !== '') {
        if (validators.type === 'number' && isNaN(Number(val))) {
          return res.status(400).json({ error: `Field '${field}' must be a number.` });
        }
        if (validators.positive && Number(val) <= 0) {
          return res.status(400).json({ error: `Field '${field}' must be positive.` });
        }
        if (validators.enum && !validators.enum.includes(val)) {
          return res.status(400).json({ error: `Field '${field}' must be one of: ${validators.enum.join(', ')}.` });
        }
        if (validators.regex && !validators.regex.test(val)) {
          return res.status(400).json({ error: `Field '${field}' format is invalid.` });
        }
      }
    }
    next();
  };
};
