const path = require('path')
const Group = require(path.join(__dirname, './../db/models/groupModel.js'))
const yelpAPI = require(path.join(__dirname, './../controllers/yelpController.js'))
const _ = require('underscore')

function getGroups (req, res) {
  Group.find().then(function (data) {
    res.status(200).json(data)
  })
  .catch((err) => {
    console.error('Error fetching group')
    res.status(501).send(err)
  })
}

function createGroup (req, res) {
  yelpAPI(req, res)
  .then((group) => {
    new Group(group)
    .save()
    .then((data) => {
      res.status(201).json({groupName: group.groupName})
    })
    .catch((err) => {
      console.error('Error POSTing new client group')
      res.status(501).send(err)
    })
  })
  .catch((err) => {
    console.log(err)
  })
}

function getOneGroup (req, res) {
  let groupName = req.params.groupName
  Group.find({groupName: groupName})
  .then(function (data) {
    res.status(200).json(data[0])
  })
  .catch((err) => {
    console.error('[Error fetching group]')
    res.status(501).send('[Error fetching group]', err)
  })
}

function addVote (req, res) {
  let groupName = req.params.groupName
  Group.findOne({ groupName: groupName })
  .then((group) => {
    group.votes.push({
      yelpApiId: req.body.yelpApiId,
      vote: req.body.vote
    })
    return group
  }).then((group) => {
    group.save()
    .then(() => {
      res.status(201).send('Votes saved to db')
    })
  })
  .catch((err) => {
    console.error('[Error fetching group]')
    res.status(501).send('[Error fetching group]', err)
  })
}

function calculateWinner (req, res) {
  let groupName = req.params.groupName
  Group.findOne({ groupName: groupName })
    .then((group) => {
      let votesArray = group.votes
      let votesResult = _(votesArray).groupBy('yelpApiId')
      let output = _(votesResult).map((elem, key) => {
        return { yelpApiId: key,
          vote: _(elem).reduce((a, b) => { return a + b.vote }, 0)}
      })
      let result = _.max(output, function (item) { return item.vote })
      group.winner = result.yelpApiId
      group.isVoting = false
      group.save()
        .then((group) => {
          console.log(group.winner)
          res.status(201).json(group)
        })
        .catch((err) => {
          console.error('[Error Calculating Winner]')
          res.status(501).send('[Error Calculating Winner]', err)
        })
    })
}

module.exports.getGroups = getGroups
module.exports.createGroup = createGroup
module.exports.getOneGroup = getOneGroup
module.exports.addVote = addVote
module.exports.calculateWinner = calculateWinner
