const express = require('express');
const bcrypt = require('bcryptjs');

const Settings = require('../models/Settings');
const requireAdmin = require('../middleware/auth');

const router = express.Router();


// =====================================================
// UPI VALIDATION
// =====================================================

const UPI_RE = /^[\w.-]{2,}@[\w.-]{2,}$/;


// =====================================================
// PUBLIC SETTINGS
// Never return admin password/hash
// =====================================================

function publicView(settings) {
  return {
    storeName: settings.storeName,
    tagline: settings.tagline,

    upiId: settings.upiId,
    payeeName: settings.payeeName,

    // SHIPPING
    shippingCharge:
      Number(settings.shippingCharge) || 0,

    // CONTACT
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,

    address: settings.address,
    city: settings.city,
    state: settings.state,
    pincode: settings.pincode,

    // SOCIAL
    instagram: settings.instagram,
    facebook: settings.facebook,

    // OTHER
    googleMaps: settings.googleMaps,
    aboutText: settings.aboutText
  };
}


// =====================================================
// GET SETTINGS
// GET /api/settings
// PUBLIC
// =====================================================

router.get('/', async (req, res) => {
  try {
    const settings =
      await Settings.getOrCreate();

    res.json(
      publicView(settings)
    );

  } catch (error) {
    console.error(
      'Get settings error:',
      error
    );

    res.status(500).json({
      error:
        'Could not load settings.'
    });
  }
});


// =====================================================
// SAVE SETTINGS
// PUT /api/settings
// ADMIN ONLY
// =====================================================

router.put(
  '/',
  requireAdmin,
  async (req, res) => {
    try {
      const {
        storeName,
        tagline,

        upiId,
        payeeName,

        shippingCharge,

        phone,
        whatsapp,
        email,

        address,
        city,
        state,
        pincode,

        instagram,
        facebook,

        googleMaps,
        aboutText,

        newPasscode
      } = req.body;


      // =================================================
      // UPI
      // =================================================

      const cleanUpiId =
        typeof upiId === 'string'
          ? upiId.trim()
          : '';

      if (
        cleanUpiId &&
        !UPI_RE.test(cleanUpiId)
      ) {
        return res.status(400).json({
          error:
            'Enter a UPI ID in the form name@bank.'
        });
      }


      // =================================================
      // SETTINGS
      // =================================================

      const settings =
        await Settings.getOrCreate();


      // =================================================
      // STORE
      // =================================================

      settings.storeName =
        typeof storeName === 'string' &&
        storeName.trim()
          ? storeName.trim()
          : 'My Shop';

      settings.tagline =
        typeof tagline === 'string'
          ? tagline.trim()
          : '';


      // =================================================
      // PAYMENT
      // =================================================

      settings.upiId =
        cleanUpiId;

      settings.payeeName =
        typeof payeeName === 'string'
          ? payeeName.trim()
          : '';


      // =================================================
      // SHIPPING
      // =================================================

      const numericShipping =
        Number(shippingCharge);

      if (
        !Number.isFinite(
          numericShipping
        ) ||
        numericShipping < 0
      ) {
        return res.status(400).json({
          error:
            'Enter a valid delivery charge of 0 or more.'
        });
      }

      settings.shippingCharge =
        numericShipping;


      // =================================================
      // CONTACT
      // =================================================

      settings.phone =
        typeof phone === 'string'
          ? phone.trim()
          : '';

      settings.whatsapp =
        typeof whatsapp === 'string'
          ? whatsapp.trim()
          : '';

      settings.email =
        typeof email === 'string'
          ? email.trim()
          : '';

      settings.address =
        typeof address === 'string'
          ? address.trim()
          : '';

      settings.city =
        typeof city === 'string'
          ? city.trim()
          : '';

      settings.state =
        typeof state === 'string'
          ? state.trim()
          : '';

      settings.pincode =
        typeof pincode === 'string'
          ? pincode.trim()
          : '';


      // =================================================
      // SOCIAL
      // =================================================

      settings.instagram =
        typeof instagram === 'string'
          ? instagram.trim()
          : '';

      settings.facebook =
        typeof facebook === 'string'
          ? facebook.trim()
          : '';


      // =================================================
      // GOOGLE MAPS
      // =================================================

      settings.googleMaps =
        typeof googleMaps === 'string'
          ? googleMaps.trim()
          : '';


      // =================================================
      // ABOUT
      // =================================================

      settings.aboutText =
        typeof aboutText === 'string'
          ? aboutText.trim()
          : '';


      // =================================================
      // CHANGE PASSWORD
      // =================================================

      if (
        typeof newPasscode === 'string' &&
        newPasscode.trim()
      ) {
        settings.passcodeHash =
          await bcrypt.hash(
            newPasscode.trim(),
            10
          );
      }


      // =================================================
      // SAVE DATABASE
      // =================================================

      await settings.save();


      // =================================================
      // RETURN SAVED SETTINGS
      // =================================================

      res.json(
        publicView(settings)
      );

    } catch (error) {
      console.error(
        'Save settings error:',
        error
      );

      res.status(500).json({
        error:
          "Couldn't save settings."
      });
    }
  }
);


module.exports = router;