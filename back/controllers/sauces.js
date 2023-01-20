const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  sauce.save()
    .then(result => {
      console.log(result)
      res.status(201).json({message: 'Objet enregistré !'})
    })
    .catch(error => {
      console.log(error)
      res.status(400).json( { error })
    });
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
    ...JSON.parse(req.body.sauce),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body};

  delete sauceObject._userId;
  Sauce.findOne({_id: req.params.id})
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: 'Not authorized'})
      } else {
        Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
        .then(() => res.status(200).json({message : 'Objet modifié!'}))
        .catch(error => res.status(401).JSON({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
  });

  Sauce.updateOne({_id: req.params.id}, sauce).then(
    () => {
      res.status(201).json({
        message: 'Sauce updated successfully!'
      });
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id})
    .then(sauce => {
      if (sauce.userId != req.auth.userId) {
          res.status(401).json({message: 'Not authorized'});
      } else {
          const filename = sauce.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
            Sauce.deleteOne({_id: req.params.id})
              .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
              .catch(error => res.status(401).json({ error }));
        });
      }
    })
      .catch( error => {
        res.status(500).json({ error });
      });    
};

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error}))
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findById(req.params.id).then(
    (sauce) => {
      console.log(sauce)
      res.status(200).json(sauce);
    }
  ).catch(
    (error) => {
      console.log(error)
      res.status(400).json({
        error: error
      });
    }
  );
};

// TODO
exports.likeSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.Sauce);

  Sauce.findOne({_id: req.params._id})
    .then(sauce => {
      if (sauce._userId = req.auth._userId) {
        res.status(400).json({message: "Vous n'êtes pas autorisé à 'liker' votre propre sauce "})
      } else {
        if (condition) {
          
        } else {
          
        }
        
      }
    })
    .catch(error = res.status(500).json({ error }))
}