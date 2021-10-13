const { Router } = require('express');
const router = Router();
const bcrypt = require('bcrypt');
const jwtGenerator = require('../utils/jwtGenerator');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const User = require('../models/User');
const Like = require('../models/Like');
const validator = require('../middleware/validator');
const { getUserEmail, getNumberOfLikes, getNumberOfDislikes, getNumberOfQuestionAnswers } = require('../utils/helperFunctions');


router.post("/addAnswer", async (req, res) => {
    try {
        var userId = res.locals.id;
        const {questionId, description, date} = req.body;

        const newAnswer = await Answer.create({description: description, date: date, UserId: userId, QuestionId: questionId});

        var currentUserId = res.locals.id;
        var currentUsersAnswer = false;
        if(newAnswer.UserId === currentUserId) {
            currentUsersAnswer = true;
        }

        const email = await getUserEmail(newAnswer.UserId);
        var data = {
            "id": newAnswer.id,
            "description": newAnswer.description,
            "date": newAnswer.date,
            "UserId": newAnswer.UserId,
            "QuestionId": newAnswer.QuestionId,
            "userEmail": email,
            "currentUsersAnswer": currentUsersAnswer
        }
    
        res.status(201).json(data);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
});

router.get("/questionAnswers/:questionId", async (req, res) => {
    try {
        var currentUserId = res.locals.id;
        const answers = await Answer.findAll({
            where: {
                question_id: req.params.questionId
            },
            order: [
                ['date', 'DESC']
            ]
        });

        var result = [];

        for(var i = 0; i < answers.length; i++) {
            var currentUsersAnswer = false;
            if(answers[i].UserId === currentUserId) {
                currentUsersAnswer = true;
            }

            const email = await getUserEmail(answers[i].UserId);
            var data = {
                "id": answers[i].id,
                "description": answers[i].description,
                "date": answers[i].date,
                "UserId": answers[i].UserId,
                "QuestionId": answers[i].QuestionId,
                "userEmail": email,
                "currentUsersAnswer": currentUsersAnswer
            }

            result.push(data);
        }
        
        res.json(result);

    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
});

router.delete("/answer/:answerId", async (req, res) => {
    try {
        const del = await Answer.destroy({
            where: {
                id: req.params.answerId
            }
        });
        
        res.json(del);

    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
});

router.post("/questionVote", async (req, res) => {
    try {
        var userId = res.locals.id;
        const {questionId, isLike} = req.body;

        const like = await Like.findOne({
            where: {
                UserId: userId,
                QuestionId: questionId,
                is_like: isLike
            }
        });

        if(!like) {
            const newLike = await Like.create({UserId: userId, QuestionId: questionId, is_like: isLike});
            res.status(201).json(newLike);
        } else {
            res.status(401).json('Already give a vote to this question');
        }
    
    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
});

router.put("/editAnswer", async (req, res) => {
    try {
        const {id, description, date} = req.body;

        const editedAnswer = await Answer.update({description: description, date: date}, 
                { where: { id: id } }
                );
    
        res.status(201).json(editedAnswer);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
});

router.get("/userQuestions", async (req, res) => {
    try {
        var userId = res.locals.id;
        const result = [];
        const questions = await Question.findAll({
            where: {
                UserId: userId
            },
            order: [
                ['date', 'DESC']
            ]
        });

        for(var i = 0; i < questions.length; i++) {
            
            const numberOfAnswers = await getNumberOfQuestionAnswers(questions[i].id);
            const numberOfLikes = await getNumberOfLikes(questions[i].id);
            const numberOfDislikes = await getNumberOfDislikes(questions[i].id);
            const userEmail = await getUserEmail(questions[i].UserId);

            var data = {
                id: questions[i].id,
                userId: questions[i].userId,
                title: questions[i].title,
                description: questions[i].description,
                date: questions[i].date,
                numberOfLikes: numberOfLikes,
                numberOfDislikes: numberOfDislikes,
                numberOfAnswers: numberOfAnswers,
                userEmail: userEmail
            }
    
            result.push(data);
        }

        res.json(result);

    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
});

router.delete("/question/:questionId", async (req, res) => {
    try {
        const delLikes = await Like.destroy({
            where: {
                QuestionId: req.params.questionId
            }
        });

        const delAnswers = await Answer.destroy({
            where: {
                QuestionId: req.params.questionId
            }
        });

        const del = await Question.destroy({
            where: {
                id: req.params.questionId
            }
        });
        
        res.json(del);

    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
});

module.exports = router;