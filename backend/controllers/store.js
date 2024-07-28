const Store = require("../models/stores");
const User = require("../models/users");
const jwt = require("jsonwebtoken");

module.exports.registerStore = async (req, res) => {
  try {
    const { gst_No, name, latitude, longitude, pincode, address } =
      req.body.formData;
    const token = req.body.token;

    if (!token)
      return res
        .status(400)
        .json({
          message:
            "Seems Like you are not logged in... Please Login for registering your store!",
        });

    const decodedToken = jwt.verify(token, "secretkey");

    if (!gst_No || !name || !pincode || !address)
      return res
        .status(400)
        .json({
          message:
            "Some required information is missing... Please fill in all the fields!",
        });

    const store = new Store({
      gst_No,
      name,
      latitude,
      longitude,
      pincode,
      address,
      owner: decodedToken.user._id,
    });

    const newStore = await store.save();

    newStore.populate("owner");

    const user = await User.findOneAndUpdate(
      { _id: decodedToken.user._id },
      { store: newStore._id },
      { new: true, populate: "store" }
    );

    const newToken = jwt.sign({ user }, "secretkey", { algorithm: "HS256" });
    res
      .status(200)
      .json({ message: "Your Store Successfully Added...", token: newToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

module.exports.updateStore = async (req, res) => {
  try {
    console.log(req.body);
    const { gst_No, name, pincode, address } = req.body.formData;
    const token = req.body.token;

    if (!token)
      return res
        .status(400)
        .json({ message: "Something went wrong! Are you logged in?" });



    if (!gst_No || !name || !pincode || !address)
      return res
        .status(400)
        .json({
          message:
            "Some required information is missing... Please fill in all the fields!",
        });

    const store = await Store.findOneAndUpdate({ gst_No }, req.body.formData, {
      new: true,
      runValidators: true,
    });

    const decodedToken = jwt.verify(token, "secretkey");

    const updatedUser =await User.findOne({username : decodedToken.user.username}).populate('store');

    const newToken = jwt.sign({ user: updatedUser }, "secretkey", {
      algorithm: "HS256",
    });

    if (!store) return res.status(400).json({ message: "Store not found" });
    res
      .status(200)
      .json({ message: "Store Details Updated Successfully...", token:newToken });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

module.exports.deleteStore = async (req, res) => {
  try {
    const { gst_No } = req.body;
    const store = await Store.findOneAndDelete({ gst_No });
    if (!store) return res.status(400).json({ message: "Store not found" });
    res.status(200).json({ message: "Store deleted successfully..." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

module.exports.fetchStores = async (req, res) => {
  try {
    const { gst_No } = req.body;
    if (gst_No === undefined) {
      const stores = await Store.find({}).populate("owner");
      res
        .status(200)
        .json({ message: "Here we can see the data of all Stores...", stores });
    } else {
      const store = await Store.findOne({ gst_No });
      if (!store) return res.json({ message: "Store not found" });
      res
        .status(200)
        .json({ message: "Your Requested Store Details...", store });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
