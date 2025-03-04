import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, runTransaction, limit } from 'firebase/firestore';
import { Button, TextField, Box, Typography, CircularProgress } from '@mui/material';

const FormComponent = () => {
  const [mailSent,setMailSent] = useState(false);
  const location = useLocation();
  const [title, setTitle] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    school: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    const parsedTitle = path.replace(/-/g, ' ');
    setTitle(parsedTitle);
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await runTransaction(db, async (transaction) => {
        // Check existing user
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where("email", "==", formData.email));
        const userSnapshot = await getDocs(userQuery);
        const userExists = !userSnapshot.empty;

        // Check existing access for title
        const accessCodesRef = collection(db, `titles/${title}/Access Codes`);
        const existingAccessQuery = query(
          accessCodesRef,
          where("RegisteredTo", "==", formData.email)
        );
        const existingAccessSnapshot = await getDocs(existingAccessQuery);

        if (!existingAccessSnapshot.empty) {
          const existingCode = existingAccessSnapshot.docs[0].data().AccessCode;
          
            const response = await fetch("https://prod-159.westeurope.logic.azure.com:443/workflows/6a58a2415b6647a2b65695d753c67e22/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=fAokiM68xpzSnRLQ-Aj84W6bv7YemYxSAk7HzEpZmbA", {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: formData.email,
                accessCode: existingCode
              })
            });
            
            if(response.ok) {
              setMailSent(true);
              throw new Error(`You already have access to ${title}. Access Code: ${existingCode}`);
              //Form Reset Code
            }
        }

        // Find available code
        const availableCodesQuery = query(
          accessCodesRef,
          where("Status", "==", "available"),
          limit(1)
        );
        const availableCodesSnapshot = await getDocs(availableCodesQuery);

        if (availableCodesSnapshot.empty) {
          throw new Error('No available access codes for this title');
        }

        const codeDoc = availableCodesSnapshot.docs[0];
        const accessCode = codeDoc.data().AccessCode;

        // Update access code document
        transaction.update(codeDoc.ref, {
          RegisteredTo: formData.email,
          SubmissionDate: new Date(),
          Status: "enabled"
        });

        if (!userExists) {
          const newUserRef = await addDoc(usersRef, {
            ...formData,
            CreatedAt: new Date()
          });
          transaction.set(newUserRef, {
            ...formData,
            CreatedAt: new Date()
          });
        }
        

        return accessCode;
      }).then(async (accessCode) => {
        if(!mailSent){
          const response = await fetch('https://prod-51.westeurope.logic.azure.com:443/workflows/6254a6918699438494d16d7d36258496/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=8NrImwR370OkhjiJgq9Ml1JiXNbbt65j4iZF8ABnhJo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: formData.email,
              accessCode: accessCode
            })
          });
          if (!response.ok) {
            throw new Error('Failed to trigger Power Automate flow');
          }
          setMailSent(true);
        }

        const newResponse = await fetch("https://prod-155.westeurope.logic.azure.com:443/workflows/c1ee2f35ff714730804e6c93d0b32f37/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=D78CcSe1GGPUYDFhRI0xjN7c0uz2sA_tLXo1v277iZo", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            accessCode: accessCode
          })
        });

        if (!newResponse.ok) {
          throw new Error('Failed to trigger Power Automate flow');

        }
        setMailSent(true);

        alert(`Access granted! Your code: ${accessCode}`);
        setFormData({
          email: '',
          username: '',
          school: '',
          city: ''
        });
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
      }).catch((error) => {
        alert(error.message);
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {title} Registration
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Title"
          value={title}
          margin="normal"
          InputProps={{ readOnly: true }}
        />
        <TextField
          fullWidth
          label="School"
          name="school"
          value={formData.school}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          margin="normal"
          required
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit'}
        </Button>
        {submitted && (
          <Typography color="primary" sx={{ mt: 2 }}>
            Registration successful! ✔️
          </Typography>
        )}
      </form>
    </Box>
  );
};

export default FormComponent;