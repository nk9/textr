import CancelIcon from '@mui/icons-material/Cancel';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import format from 'string-template';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  color: theme.palette.text.secondary,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));

export default function Index() {
  var defaultMessage = "Hi {firstname}, this is {myname} from the ONE Campaign. " +
    "I was just checking to confirm your 3pm canvass. " +
    "The building is locked, so park in the back. " +
    "We will have the door propped open for you. See you soon!";

  const [nameNumber, setNameNumber] = useState('')
  const [message, setMessage] = useState(defaultMessage)
  const [myName, setMyName] = useState('')
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [composedMessage, setComposedMessage] = useState('');


  useEffect(() => {
    setComposedMessage(format(message, {
      myname: myName,
      firstname: name
    }))
  }, [myName, name, number]);

  let smsto = `smsto:${number}:${composedMessage}`

  const nameNumberChanged = (event) => {
    setNameNumber(event.target.value)
    let [rawName, rawNum] = event.target.value.split('\t')
    
    if (rawName && rawName.length > 2) {
      if (rawName.indexOf(' ') >= 0) {
        let [rawFirst, _] = rawName.split(' ');
        setName(rawFirst)
      } else {
        setName(rawName)
      }
    }
    if (rawNum && rawNum.length == 12) {
      setNumber(rawNum)
    }
  }

  const myNameChanged = (event) => {
    setMyName(event.target.value)
  }

  const messageChanged = (event) => {
    // console.log(`changed message to: ${event.target.value}`)
    setMessage(event.target.value)
  }

  let validSVG = false;
  if (myName && name && number && composedMessage) {
    validSVG = true;
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Textr
      </Typography>

      <Grid container spacing={1}>
        <Grid size={5}>
          <Box>
            <TextField
              value={myName}
              label="My Name"
              variant="outlined"
              autoFocus
              onChange={myNameChanged} />
            <IconButton aria-label="delete" size="large" onClick={() => setMyName('')}>
              <CancelIcon fontSize="inherit" />
            </IconButton>
          </Box>
          <Box sx={{ my: 4, width: '400px', display: 'flex' }}>
            <Box sx={{ width: '370px' }}>
              <TextField
                value={nameNumber}
                label="Their name & cell number"
                variant="outlined"
                fullWidth
                autoFocus
                onChange={nameNumberChanged} />
            </Box>
            <IconButton aria-label="delete" size="large" onClick={() => setNameNumber('')}>
              <CancelIcon fontSize="inherit" />
            </IconButton>
          </Box>
          <Box sx={{ my: 4, width: '400px' }}>
            <TextField
              id="text-message"
              label="Text message"
              multiline
              value={message}
              onChange={messageChanged}
              rows={6}
              fullWidth
            />
          </Box>
          <Box sx={{ my: 4 }}>
            Available tokens: <tt>{'{'}firstname{'}'}</tt>, <tt>{'{'}myname{'}'}</tt>
          </Box>
        </Grid>
        <Grid size={4}>
          <Item>
            <Grid container spacing={1}>
              <Grid size={3}>To:</Grid>
              <Grid size={8}>{number}</Grid>
              <Grid size={3}>Message:</Grid>
              <Grid size={8}>{composedMessage}</Grid>
            </Grid>
          </Item>
          <Box sx={{ my: 4 }}>
            <QRCodeSVG
              value={smsto}
              size={200}
              fgColor={validSVG ? "black" : "lightgray"} />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
