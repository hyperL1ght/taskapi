const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = express.Router()

router.post('/tasks', auth, async (req, res) => {

    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try{
        const result = await task.save()
        res.status(201).send(result)
    } catch(error){
        res.status(400).send(error)
    }

})

// add filtering, pagination, sorting
// api: 
// GET /tasks?completed=true
// GET /tasks?limit=3&skip=0
// GET /tasks?sortBy=createAt:desc or asc
router.get('/tasks', auth, async (req, res) => {

    const match = {}
    const sort = {}

    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try{
        // const result = await Task.find({owner: req.user._id})
        await req.user.populate({
            path: 'tasks',
            match: match, // filter
            options: {
                limit: parseInt(req.query.limit), // pagination 
                skip: parseInt(req.query.skip), // pagination
                sort: sort // sort
            },
        }).execPopulate()
        res.status(200).send(req.user.tasks)
    } catch(error){
        res.status(400).send(error)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {

    const _id = req.params.id

    try{
        const result = await Task.findOne({_id, owner: req.user._id})
        if(!result){
            return res.status(404).send()
        }
        res.send(result)
    } catch(error){
        res.status(500).send(error)
    }

})

router.patch('/tasks/:id', auth, async (req, res) => {

    const allowedUpdates = ['description', 'completed']
    const updates = Object.keys(req.body)
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid updates.'})
    }

    try{
        const result = await Task.findOne({_id: req.params.id, owner: req.user._id})
        
        if(!result){
            return res.status(404).send()
        }
        
        updates.forEach((update) => result[update] = req.body[update])
        await result.save()

        res.send(result)

    } catch(error){
        res.status(400).send(error)
    }

})

router.delete('/tasks/:id', auth, async (req, res) => {

    try{
        const result = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})

        if(!result){
            return res.status(404).send()
        }

        res.send(result)

    }catch(error){
        res.status(500).send(error)
    }

})

module.exports = router