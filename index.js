// require('dotenv').config()
// const express = require('express');
import 'dotenv/config';
import express from 'express'
const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/login' , (req, res) => {
    res.send("Login Page")
})

app.get('/quotes' , (req, res) => {
  const quotes =  [
  {
    id: 1,
    title: "Believe in Yourself",
    quote: "Believe you can, and you are already halfway there."
  },
  {
    id: 2,
    title: "Keep Going",
    quote: "Success comes to those who keep moving forward."
  },
  {
    id: 3,
    title: "Never Give Up",
    quote: "Difficult roads often lead to beautiful destinations."
  },
  {
    id: 4,
    title: "Work Hard",
    quote: "Dreams do not work unless you do."
  },
  {
    id: 5,
    title: "Stay Positive",
    quote: "A positive mindset brings positive results."
  },
  {
    id: 6,
    title: "Take Action",
    quote: "The best way to start is to stop waiting and begin."
  },
  {
    id: 7,
    title: "Be Strong",
    quote: "You are stronger than the challenges in front of you."
  },
  {
    id: 8,
    title: "Learn Daily",
    quote: "Every expert was once a beginner who refused to quit."
  },
  {
    id: 9,
    title: "Focus",
    quote: "Focus on progress, not perfection."
  },
  {
    id: 10,
    title: "Create Your Future",
    quote: "Your future is built by what you do today."
  }
];
  res.json(quotes)
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})