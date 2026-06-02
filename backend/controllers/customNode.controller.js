const CustomNode = require("../models/customNode.model");

exports.getAllCustomNodes = async (req, res) => {
  try {
    const nodes = await CustomNode.find();
    res.status(200).json({ success: true, data: nodes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createCustomNode = async (req, res) => {
  try {
    const node = await CustomNode.create(req.body);
    res.status(201).json({ success: true, data: node });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteCustomNode = async (req, res) => {
  try {
    await CustomNode.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
