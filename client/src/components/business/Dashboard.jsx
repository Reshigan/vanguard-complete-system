import React from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  Button,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import BusinessLayout from './BusinessLayout';

// Sample data for the dashboard
const stats = [
  { title: 'Total Authentications', value: '12,543', change: '+12%', positive: true },
  { title: 'Suspicious Activities', value: '243', change: '-8%', positive: true },
  { title: 'Active Products', value: '87', change: '+5%', positive: true },
  { title: 'Consumer Reports', value: '156', change: '+24%', positive: false }
];

const recentActivities = [
  { id: 1, type: 'authentication', product: 'Premium Headphones', time: '5 minutes ago', status: 'success' },
  { id: 2, type: 'report', product: 'Smart Watch', time: '1 hour ago', status: 'warning' },
  { id: 3, type: 'authentication', product: 'Bluetooth Speaker', time: '3 hours ago', status: 'error' },
  { id: 4, type: 'authentication', product: 'Gaming Mouse', time: '5 hours ago', status: 'success' },
  { id: 5, type: 'report', product: 'Wireless Earbuds', time: '1 day ago', status: 'warning' }
];

const topProducts = [
  { id: 1, name: 'Premium Headphones', authentications: 2456, success: 98.5 },
  { id: 2, name: 'Smart Watch', authentications: 1832, success: 97.2 },
  { id: 3, name: 'Bluetooth Speaker', authentications: 1245, success: 99.1 },
  { id: 4, name: 'Gaming Mouse', authentications: 987, success: 96.8 },
  { id: 5, name: 'Wireless Earbuds', authentications: 876, success: 95.4 }
];

const channelPerformance = [
  { id: 1, name: 'Official Store', score: 98, status: 'Excellent' },
  { id: 2, name: 'Authorized Retailers', score: 92, status: 'Good' },
  { id: 3, name: 'Online Marketplace A', score: 85, status: 'Good' },
  { id: 4, name: 'Online Marketplace B', score: 65, status: 'Moderate' },
  { id: 5, name: 'Third-party Resellers', score: 45, status: 'Poor' }
];

const Dashboard = () => {
  return (
    <BusinessLayout title="Dashboard">
  <Box sx={{ flexGrow: 1, px: { xs: 0, sm: 2 } }}>
        {/* Key Statistics */}
  <Grid container spacing={2} sx={{ mb: 2 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  display: 'flex',
                  flexDirection: 'column',
                  height: { xs: 100, sm: 120 },
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  {stat.title}
                </Typography>
                <Typography variant="h4" sx={{ my: 1, fontWeight: 600 }}>
                  {stat.value}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {stat.positive ? (
                    <TrendingUpIcon color="success" fontSize="small" />
                  ) : (
                    <TrendingDownIcon color="error" fontSize="small" />
                  )}
                  <Typography
                    variant="body2"
                    sx={{ ml: 0.5 }}
                    color={stat.positive ? 'success.main' : 'error.main'}
                  >
                    {stat.change} from last month
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

  <Grid container spacing={2}>
          {/* Recent Activities */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', minWidth: 0 }}>
              <CardHeader 
                title="Recent Activities" 
                titleTypographyProps={{ variant: 'h6' }}
                action={
                  <Button size="small" color="primary">View All</Button>
                }
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <List sx={{ width: '100%' }}>
                  {recentActivities.map((activity) => (
                    <React.Fragment key={activity.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          <Avatar 
                            sx={{ 
                              bgcolor: 
                                activity.status === 'success' ? 'success.light' : 
                                activity.status === 'warning' ? 'warning.light' : 
                                'error.light'
                            }}
                          >
                            {activity.status === 'success' ? (
                              <CheckCircleIcon />
                            ) : activity.status === 'warning' ? (
                              <WarningIcon />
                            ) : (
                              <ErrorIcon />
                            )}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2">
                              {activity.type === 'authentication' ? 'Product Authentication' : 'Consumer Report'}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.primary">
                                {activity.product}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {activity.time}
                              </Typography>
                            </>
                          }
                        />
                        <Chip 
                          label={
                            activity.status === 'success' ? 'Authentic' : 
                            activity.status === 'warning' ? 'Suspicious' : 
                            'Counterfeit'
                          } 
                          size="small"
                          color={
                            activity.status === 'success' ? 'success' : 
                            activity.status === 'warning' ? 'warning' : 
                            'error'
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Products */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', minWidth: 0 }}>
              <CardHeader 
                title="Top Products" 
                titleTypographyProps={{ variant: 'h6' }}
                action={
                  <Button size="small" color="primary">View All</Button>
                }
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ width: '100%', overflowX: 'auto' }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Authentications</TableCell>
                          <TableCell align="right">Success Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell component="th" scope="row">
                              {product.name}
                            </TableCell>
                            <TableCell align="right">{product.authentications.toLocaleString()}</TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <Typography variant="body2" sx={{ mr: 1 }}>
                                  {product.success}%
                                </Typography>
                                {product.success >= 98 ? (
                                  <CheckCircleIcon fontSize="small" color="success" />
                                ) : product.success >= 95 ? (
                                  <CheckCircleIcon fontSize="small" color="info" />
                                ) : (
                                  <WarningIcon fontSize="small" color="warning" />
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Channel Performance */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mt: 3, minWidth: 0 }}>
              <CardHeader 
                title="Distribution Channel Performance" 
                titleTypographyProps={{ variant: 'h6' }}
                action={
                  <Button size="small" color="primary">View Details</Button>
                }
              />
              <Divider />
              <CardContent>
                <Grid container spacing={1}>
                  {channelPerformance.map((channel) => (
                    <Grid item xs={12} sm={6} md={4} key={channel.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2">{channel.name}</Typography>
                          <Chip 
                            label={channel.status} 
                            size="small"
                            color={
                              channel.score >= 90 ? 'success' : 
                              channel.score >= 70 ? 'info' : 
                              channel.score >= 50 ? 'warning' : 
                              'error'
                            }
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mr: 1 }}>
                            {channel.score}/100
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Trust Score
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={channel.score} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: 'background.default',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: 
                                channel.score >= 90 ? 'success.main' : 
                                channel.score >= 70 ? 'info.main' : 
                                channel.score >= 50 ? 'warning.main' : 
                                'error.main'
                            }
                          }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </BusinessLayout>
  );
};

export default Dashboard;