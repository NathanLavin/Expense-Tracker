import { ObjectId } from "mongodb";

const validId = (paramId) => {
  return (req, res, next) => {
    try {
      req[paramId] = new ObjectId(req.params[paramId]);
      return next();
    } catch (err) {
      return res.status(404).json({ errors: `${paramId} is not a valid ObjectId.` });
    }
  };
};

export { validId };