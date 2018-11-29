const express = require('express');
const stripe = require('./constants/stripe.js');
const users = require('../users/usersModel');
const payments = require('./paymentsModel');
const router = express.Router();
const { ensureAuthenticated } = require('../auth/docusign/dsMiddleware');

const postStripeCharge = res => (stripeErr, stripeRes) => {
  if (stripeErr) {
    res.status(500).send({ error: stripeErr });
  } else {
    res.status(200).send({ success: stripeRes });
  }
};

router.get('/', (req, res) => {
  payments
    .find()
    .then(invoices => {
      res.status(200).json(invoices);
    })
    .catch(err => {
      res.status(500).json({ ErrorMessage: err.message });
    });
});

router.get('/:userId', ensureAuthenticated, (req, res) => {
  console.log(req.user);
});

router.post('/', ensureAuthenticated, (req, res) => {
  users
    .findByUserId(req.user.id)
    .then(user => {
      let user_id = String(user.id);
      stripe.charges
        .create(req.body)
        .then(invoice => {
          const { description, amount, currency } = invoice;
          payments
            .addInvoice({ user_id, description, amount, currency })
            .then(invoice => {
              postStripeCharge(
                res.status(201).json({
                  user_id,
                  description,
                  amount,
                  currency,
                })
              );
            })
            .catch(err => {
              res.status(500).json({ ErrorMessage: err.message });
            });
        })
        .catch(err => {
          res.status(500).json({ ErrorMessage: err.message });
        });
    })
    .catch(err => {
      res.status(500).json({ ErrorMessage: err.message });
    });
});

module.exports = router;
