const Sauce = require('../models/Sauce');
const fs = require('fs');

// afficher les sauces
exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error}))
};

//afficher les detailles d'un sauce
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

// ajouter la sauce
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

// modifier la sacuce
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
};

//supprimer la sauce
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

//commenter une sauce
exports.likeSauce = (req, res, next) => {
  const likeObject = req.body

  Sauce.findById(req.params.id)
    .then(sauceObject => {
      if (sauceObject.userId === req.auth._userId) {
        res.status(400).json({message: "Vous n'êtes pas autorisé à 'liker' votre propre sauce "})
      } else {
        let usersLikedId = sauceObject.usersLiked.includes(req.body.userId);
        let usersDislikedId = sauceObject.usersDisliked.includes(req.body.userId);
        switch (likeObject.like) {
          //ajouter like
          case 1:          
            if (usersLikedId) {
              res.status(401).json({ message: 'Vous avez deja like cette sauce'})
            } else {
              sauceObject.likes = sauceObject.likes + 1;
              sauceObject.usersLiked.push(likeObject.userId)
              Sauce.findByIdAndUpdate(req.params.id, sauceObject)
                .then(() => res.status(200).json({ message: 'like ajouté'}))
                .catch(error => res.status(500).json({ error: error.message })) 
            }
              break;
          //ajouter aunnler
          case 0:
            if (!usersLikedId && !usersDislikedId) {
              res.status(401).json({ message: 'Veuillez choisire un avis' })
            } else {
              let newusersLiked = sauceObject.usersLiked.filter(id => id != req.body.userId);
              let newusersDisliked = sauceObject.usersDisliked.filter(id => id != req.body.userId);

              if (usersLikedId && usersDislikedId) {
                sauceObject.usersLiked = newusersLiked;
                sauceObject.usersDisliked = newusersDisliked;
                Sauce.findByIdAndUpdate(req.params.id, sauceObject)
                  .then(() => res.status(200).json({ message: 'like et dislike sont aunnlés '}))
                  .catch(error => res.status(500).json({ error: error.message })) 
              } else {
                if (usersLikedId) {
                  sauceObject.usersLiked = newusersLiked;
                  sauceObject.likes = sauceObject.likes - 1;
                  Sauce.findByIdAndUpdate(req.params.id, sauceObject)
                    .then(() => res.status(200).json({ message: 'like aunnlé'}))
                    .catch(error => res.status(500).json({ error: error.message }))
                } else {
                  sauceObject.usersDisliked = newusersDisliked;
                  sauceObject.dislikes = sauceObject.dislikes - 1;
                  Sauce.findByIdAndUpdate(req.params.id, sauceObject)
                    .then(() => res.status(200).json({ message: 'dislike aunnlé' }))
                    .catch(error => res.status(500).json({ error: error.message }))
                }
              }
            }
              break;
          //ajouter dislike
          case -1:
            if (usersDislikedId) {
              res.status(401).json({ message: 'Vous avez deja dislike cette sauce' })
            } else {
              let newusersLiked = sauceObject.usersLiked.filter(id => id != req.body.userId);
              sauceObject.usersLiked = newusersLiked;
              sauceObject.dislikes = sauceObject.dislikes + 1;
              sauceObject.usersDisliked.push(likeObject.userId)
              Sauce.findByIdAndUpdate(req.params.id, sauceObject)
                .then(() => res.status(200).json({ message: 'dislike ajouté'}))
                .catch(error => res.status(500).json({ error: error.message })) 
            }
              break;
        } 
      }
    })
    .catch(error => res.status(500).json({ error: error.message }))
}