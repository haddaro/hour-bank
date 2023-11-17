const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const APIFeatures = require('../utils/APIFeatures');

exports.deleteDocument = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);
    if (!document)
      return next(new AppError(`No document found with this id`, 404));
    res.status(204).json({ status: 'success', message: `document deleted` });
  });

exports.updateDocument = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: 'true',
      runValidators: 'true',
    });
    if (!document) {
      return next(new AppError('No document found with this id', 404));
    }
    res.status(200).json({ status: 'success', data: { data: document } });
  });

exports.createDocument = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body); //only possible because in app we have:
    //app.use(express.json()); middleware!
    res.status(201).json({ status: 'success', data: { data: document } });
  });

exports.getDocument = ({ Model, populateOptions }) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    console.log(`populateOptions: ${JSON.stringify(populateOptions, null, 2)}`);
    const document = await query;
    if (!document) {
      return next(new AppError('No document found with this id', 404));
    }
    res.status(200).json({ status: 'success', data: { data: document } });
  });

exports.getAllDocuments = (Model) =>
  catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const documents = await features.query;
    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: { data: documents },
    });
  });
