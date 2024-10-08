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
import replaceTemplateWithJSX from '/src/replaceTemplateWithJSX';

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
  const [plainComposedMessage, setPlainComposedMessage] = useState('');


  useEffect(() => {
    let result = replaceTemplateWithJSX(message, {
      myname: <Token key="myname">{myName}</Token>,
      firstname: <Token key="name">{name}</Token>
    });
    setComposedMessage(result)

    let plainResult = format(message, {
      myname: myName,
      firstname: name
    });
    setPlainComposedMessage(plainResult)
  }, [myName, name, message]);

  let smsto = `smsto:${number}:${plainComposedMessage}`

  useEffect(() => {
    var outName = undefined;
    var outNum = undefined;

    let [rawName, rawNum] = nameNumber.split('\t')

    if (rawName && rawName.length > 2) {
      if (rawName.indexOf(' ') >= 0) {
        let [rawFirst, _] = rawName.split(' ');
        outName = rawFirst
      } else {
        outName = rawName
      }
    }
    if (rawNum && rawNum.length == 12) {
      outNum = rawNum
    }

    setNumber(outNum);
    setName(outName);
  }, [nameNumber])

  const messageChanged = (event) => {
    setMessage(event.target.value)
  }

  let validSVG = false;
  if (myName && name && number && composedMessage) {
    validSVG = true;
  }

  let fakeQRCode = "https://apple.com";

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
              onChange={(e) => setMyName(e.target.value)} />
            <IconButton aria-label="delete" size="large" onClick={() => setMyName('')}>
              <CancelIcon fontSize="inherit" />
            </IconButton>
          </Box>
          <Box sx={{ mt: 4, width: '400px', display: 'flex' }}>
            <Box sx={{ width: '370px' }}>
              <TextField
                value={nameNumber}
                label="Their name & cell number"
                variant="outlined"
                fullWidth
                autoFocus
                onChange={(e) => setNameNumber(e.target.value)} />
            </Box>
            <IconButton aria-label="delete" size="large" onClick={() => setNameNumber('')}>
              <CancelIcon fontSize="inherit" />
            </IconButton>
          </Box>
          (Separated by a tab character. Just paste in the two cells from Google Sheets.)
          <Box sx={{ my: 4, width: '400px' }}>
            <TextField
              id="text-message"
              label="Text message"
              multiline
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              fullWidth
            />
          </Box>
          <Box sx={{ my: 4 }}>
            Available tokens: <Token><tt>{'{'}firstname{'}'}</tt></Token>, <Token><tt>{'{'}myname{'}'}</tt></Token>
          </Box>
        </Grid>
        <Grid size={4}>
          <Item>
            <Grid container spacing={1}>
              <Grid size={3} sx={{ textAlign: 'right', fontWeight: 'bold' }}>To:</Grid>
              <Grid size={8}>{number}</Grid>
              <Grid size={3} sx={{ textAlign: 'right', fontWeight: 'bold' }}>Message:</Grid>
              <Grid size={8}>{composedMessage}</Grid>
            </Grid>
          </Item>
          <Box sx={{ my: 4 }}>
            <QRCodeSVG
              value={validSVG ? smsto : fakeQRCode}
              size={256}
              fgColor={validSVG ? "black" : "lightgray"} />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

function Token({ children }) {
  return (
    <Box component="span" sx={{ color: "orangered", fontWeight: "bold" }}>
      {children}
    </Box>
  )
}
