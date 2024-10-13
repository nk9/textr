import GitHubIcon from '@mui/icons-material/GitHub';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function ButtonAppBar() {
  const router = useRouter()

  return (
    <Box sx={{ flexGrow: 1, marginBottom: 3 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Textr
          </Typography>
          <IconButton color='inherit' onClick={() => router.push('https://github.com/nk9/textr')}><GitHubIcon /></IconButton>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
