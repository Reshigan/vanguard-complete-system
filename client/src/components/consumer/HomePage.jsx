import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Paper,
  Avatar,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  QrCodeScanner as ScanIcon,
  EmojiEvents as RewardsIcon,
  Report as ReportIcon,
  ArrowForward as ArrowForwardIcon,
  Verified as VerifiedIcon,
  Security as SecurityIcon,
  Redeem as RedeemIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import ConsumerLayout from './ConsumerLayout';

const HomePage = () => {
  // Sample user data
  const user = {
    name: 'John Doe',
    points: 1250,
    level: 3,
    verifications: 24,
    nextLevelPoints: 2000,
  };

  // Sample rewards
  const rewards = [
    {
      id: 1,
      title: '$10 Gift Card',
      points: 500,
      image: 'https://via.placeholder.com/100',
    },
    {
      id: 2,
      title: 'Premium Headphones',
      points: 2500,
      image: 'https://via.placeholder.com/100',
    },
    {
      id: 3,
      title: '20% Discount',
      points: 300,
      image: 'https://via.placeholder.com/100',
    },
  ];

  // Sample recent activities
  const recentActivities = [
    {
      id: 1,
      type: 'verification',
      product: 'Premium Headphones',
      date: '2 hours ago',
      points: 50,
      status: 'authentic',
    },
    {
      id: 2,
      type: 'report',
      product: 'Smart Watch',
      date: 'Yesterday',
      points: 100,
      status: 'counterfeit',
    },
    {
      id: 3,
      type: 'reward',
      title: '$5 Gift Card',
      date: '3 days ago',
      points: -200,
      status: 'redeemed',
    },
  ];

  return (
    <ConsumerLayout title="Home">
      <Box sx={{ mb: 4 }}>
        {/* Welcome Section */}
        <Card 
          elevation={0} 
          sx={{ 
            mb: 3, 
            borderRadius: 4,
            background: 'linear-gradient(45deg, #1E88E5 30%, #42A5F5 90%)',
            color: 'white',
          }}
        >
          <CardContent sx={{ py: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={7}>
                <Typography variant="h5" gutterBottom>
                  Welcome back, {user.name}!
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                  Scan products to verify authenticity and earn rewards
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<ScanIcon />}
                  sx={{ 
                    borderRadius: 8,
                    px: 3,
                    py: 1,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)',
                    }
                  }}
                >
                  Scan Product
                </Button>
              </Grid>
              <Grid item xs={12} sm={5}>
                <Box sx={{ textAlign: 'center' }}>
                  <Paper 
                    elevation={3} 
                    sx={{ 
                      display: 'inline-block', 
                      p: 2, 
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'white' }}>
                      {user.points}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                      Reward Points
                    </Typography>
                    <Chip 
                      icon={<StarIcon />} 
                      label={`Level ${user.level}`} 
                      sx={{ 
                        mt: 1, 
                        bgcolor: 'rgba(255,255,255,0.25)',
                        color: 'white',
                        '& .MuiChip-icon': {
                          color: 'white',
                        }
                      }} 
                    />
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={4}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: 'primary.light', 
                  width: 56, 
                  height: 56,
                  mb: 1,
                }}
              >
                <ScanIcon fontSize="large" />
              </Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                Scan Product
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: 'secondary.light', 
                  width: 56, 
                  height: 56,
                  mb: 1,
                }}
              >
                <RewardsIcon fontSize="large" />
              </Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                My Rewards
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: 'error.light', 
                  width: 56, 
                  height: 56,
                  mb: 1,
                }}
              >
                <ReportIcon fontSize="large" />
              </Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                Report Fake
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Progress to Next Level */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Progress to Level {user.level + 1}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.points} / {user.nextLevelPoints} points
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(user.points / user.nextLevelPoints) * 100} 
            sx={{ 
              height: 10, 
              borderRadius: 5,
              mb: 2,
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Earn {user.nextLevelPoints - user.points} more points to reach Level {user.level + 1} and unlock new rewards!
          </Typography>
        </Paper>

        {/* Featured Rewards */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Featured Rewards</Typography>
            <Button 
              endIcon={<ArrowForwardIcon />}
              color="primary"
            >
              View All
            </Button>
          </Box>
          <Grid container spacing={2}>
            {rewards.map((reward) => (
              <Grid item xs={12} sm={4} key={reward.id}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={reward.image}
                    alt={reward.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                      {reward.title}
                    </Typography>
                    <Chip 
                      icon={<RedeemIcon />} 
                      label={`${reward.points} Points`} 
                      color="secondary" 
                      size="small"
                      sx={{ mb: 2 }}
                    />
                    <Button 
                      variant="contained" 
                      color="primary"
                      fullWidth
                      disabled={user.points < reward.points}
                    >
                      {user.points >= reward.points ? 'Redeem' : 'Not Enough Points'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Recent Activity */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            {recentActivities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <Avatar 
                        sx={{ 
                          bgcolor: 
                            activity.type === 'verification' ? 'primary.light' : 
                            activity.type === 'report' ? 'error.light' : 
                            'secondary.light'
                        }}
                      >
                        {activity.type === 'verification' ? (
                          <VerifiedIcon />
                        ) : activity.type === 'report' ? (
                          <SecurityIcon />
                        ) : (
                          <RedeemIcon />
                        )}
                      </Avatar>
                    </Grid>
                    <Grid item xs>
                      <Typography variant="subtitle2">
                        {activity.type === 'verification' ? 'Product Verification' : 
                         activity.type === 'report' ? 'Reported Counterfeit' : 
                         'Reward Redeemed'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {activity.product || activity.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.date}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Typography 
                        variant="subtitle2" 
                        color={activity.points > 0 ? 'success.main' : 'text.secondary'}
                      >
                        {activity.points > 0 ? `+${activity.points}` : activity.points} points
                      </Typography>
                      {activity.status && (
                        <Chip 
                          label={
                            activity.status === 'authentic' ? 'Authentic' : 
                            activity.status === 'counterfeit' ? 'Counterfeit' : 
                            'Redeemed'
                          } 
                          size="small"
                          color={
                            activity.status === 'authentic' ? 'success' : 
                            activity.status === 'counterfeit' ? 'error' : 
                            'secondary'
                          }
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Grid>
                  </Grid>
                </Box>
                {index < recentActivities.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Paper>
        </Box>
      </Box>
    </ConsumerLayout>
  );
};

export default HomePage;