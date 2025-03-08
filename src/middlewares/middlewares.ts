const { body, param, validationResult } = require('express-validator')

export const validate = (req: any, res: any, next: any) => {
    const err = validationResult(req)
    if (!err.isEmpty()) {
        return res.status(400).json(err.array())
    } else {
        return next()
    }
}