const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const Offer = require('../models/offer.js');
const Listing = require('../models/listing.js');
const User = require('../models/user.js');
const router = express.Router();

//--------------------------------------- PUBLIC ROUTES---------------------------------------//

//--------------------------------------- PROTECTED ROUTES---------------------------------------//
router.use(verifyToken);


// * GET SPECIFIC OFFER //
router.get("/:offerId", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    res.status(200).json(offer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: error.message });
  }
});

// GET ALL OFFERS FOR A SPECIFIC LISTING
router.get("/listing/:listingId", async (req, res) => {
  try {
    // Find all offers matching listing ID provided in the request parameters
    const offers = await Offer.find({ listing: req.params.listingId }).populate('user', 'username email');
    
    // If no offers found, respond with a 404 status and error message
    if (!offers) {
      offers = []
    }
    
    // If offers are found, respond with a 200 status and the offers data in JSON format
    res.status(200).json(offers);
  } catch (error) {
    
    // Log any errors and respond with a 500 status and error message
    console.log(error);
    res.status(500).json({ errorMessage: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    // Find all offers matching offer ID provided in the request parameters
    const offers = await Offer.find({ user: req.params.userId });
    
    // If no offers found, respond with a 404 status and error message
    if (!offers) {
      offers = []
    }
    
    // If offers are found, respond with a 200 status and the offers data in JSON format
    res.status(200).json(offers);
  } catch (error) {
    
    // Log any errors and respond with a 500 status and error message
    console.log(error);
    res.status(500).json({ errorMessage: error.message });
  }
});


// * ACCEPT OR REJECT OFFER FROM A USER (takes a query parameter {rejected: bool})//
router.put("/assess/:offerId", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId).populate("listing");
    if (!offer.listing.seller.equals(req.user._id)) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    // Use req.query to get query params
    offer.rejected = true;
    console.log("ASSESS OFFER", offer)
    const updatedOffer = await Offer.findByIdAndUpdate(req.params.offerId, offer, { new: true });
    res.status(200).json(updatedOffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: error.message });
  }
});

// * CREATE NEW OFFER //
router.post("/", async (req, res) => {
  try {
    req.body.rejected = false;
    req.body.user = req.user._id;
    // Create New Offer
    const newOffer = new Offer(req.body);
    const savedOffer = await newOffer.save();
    // Find the user and the listing
    const user = await User.findById(req.user._id);
    const listing = await Listing.findById(req.body.listing);
    if (user && listing) {
      // Ensure offers array exists
      if (!user.offers) user.offers = [];
      if (!listing.offers) listing.offers = [];
      // Associate offer with user and listing
      user.offers.push(savedOffer._id);
      listing.offers.push(savedOffer._id);
      await user.save();
      await listing.save();
    } else {
      return res.status(404).json({ errorMessage: 'User or Listing not found' });
    }
    savedOffer._doc.user = req.user;
    res.status(200).json(savedOffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: error.message });
  }
});

// * EDIT OFFERS //
router.put("/:offerId", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    if (!offer.user.equals(req.user._id)) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    req.body.user = req.user;
    req.body.listing = offer.listing;
    req.body.rejected = false;
    const updatedOffer = await Offer.findByIdAndUpdate(req.params.offerId, req.body, { new: true });
    res.status(200).json(updatedOffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: error.message });
  }
});

// * DELETE OFFER //
router.delete("/:offerId", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.offerId);
    if (!offer.user.equals(req.user._id)) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    await Offer.findByIdAndDelete(req.params.offerId);
    res.status(200).json({ message: 'Offer deleted successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errorMessage: error.message });
  }
});

module.exports = router;