import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to calculate hours between dates
const getHoursBetween = (start, end) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
};

// Get analytics data
router.get('/', async (req, res) => {
  try {
    const { period = '6months' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    let periodMonths = 6;
    
    switch (period) {
      case '1month':
        periodMonths = 1;
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        periodMonths = 3;
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        periodMonths = 6;
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        periodMonths = 12;
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        periodMonths = 6;
        startDate.setMonth(now.getMonth() - 6);
    }

    // Calculate previous period range for comparison
    const previousStartDate = new Date(startDate);
    if (period === '1year') {
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
    } else {
      previousStartDate.setMonth(previousStartDate.getMonth() - periodMonths);
    }

    // Fetch all necessary data
    const [
      tickets,
      previousTickets,
      rootCauses,
      technicians,
      teams,
      materialCatalog,
    ] = await Promise.all([
      // Current period tickets
      prisma.ticket.findMany({
        where: {
          issueTime: {
            gte: startDate,
          },
        },
        include: {
          customer: true,
          team: {
            include: {
              leader: true,
            },
          },
          priority: true,
          rootCause: true,
        },
      }),
      // Previous period tickets for comparison
      prisma.ticket.findMany({
        where: {
          issueTime: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
      }),
      prisma.rootCause.findMany(),
      prisma.technician.findMany(),
      prisma.team.findMany(),
      prisma.materialCatalog.findMany(),
    ]);

    // Calculate completed tickets
    const completedTickets = tickets.filter(ticket => ticket.status === 'COMPLETED');

    // Calculate average resolution time
    const avgResolutionTime = completedTickets.length > 0
      ? completedTickets.reduce((acc, ticket) => {
          if (ticket.issueTime && ticket.completionTime) {
            return acc + getHoursBetween(ticket.issueTime, ticket.completionTime);
          }
          return acc;
        }, 0) / completedTickets.length
      : 0;

    // Calculate tickets by status
    const activeTickets = tickets.filter(ticket => 
      ticket.status === 'NEW' || ticket.status === 'IN_PROGRESS' || ticket.status === 'IN_REVIEW'
    ).length;

    // Group tickets by day for performance data
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const performanceData = days.map(day => {
      const dayIndex = days.indexOf(day);
      const dayTickets = tickets.filter(ticket => {
        const ticketDate = new Date(ticket.issueTime);
        return ticketDate.getDay() === dayIndex;
      });
      const resolvedTickets = dayTickets.filter(ticket => ticket.status === 'COMPLETED');
      return {
        month: day,
        tickets: dayTickets.length,
        resolved: resolvedTickets.length,
        unresolved: dayTickets.length - resolvedTickets.length,
        avgTime: avgResolutionTime,
      };
    });

    // Calculate root cause distribution
    const rootCauseCounts = tickets.reduce((acc, ticket) => {
      if (ticket.rootCauseId) {
        acc[ticket.rootCauseId] = (acc[ticket.rootCauseId] || 0) + 1;
      }
      return acc;
    }, {});

    // Color palette for root causes
    const colors = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ef4444', '#14b8a6', '#f59e0b'];

    const rootCauseData = rootCauses.map((cause, index) => {
      const count = rootCauseCounts[cause.id] || 0;
      const total = tickets.length || 1;
      return {
        name: cause.name,
        value: Math.round((count / total) * 100),
        color: colors[index % colors.length],
        count: count,
      };
    });

    // Calculate technician performance
    const technicianPerformance = teams.map(team => {
      const teamTickets = tickets.filter(ticket => ticket.teamId === team.id);
      const completedTeamTickets = teamTickets.filter(ticket => ticket.status === 'COMPLETED');
      const avgTime = completedTeamTickets.length > 0
        ? completedTeamTickets.reduce((acc, ticket) => {
            if (ticket.issueTime && ticket.completionTime) {
              return acc + getHoursBetween(ticket.issueTime, ticket.completionTime);
            }
            return acc;
          }, 0) / completedTeamTickets.length
        : 0;

      return {
        name: team.name,
        tickets: teamTickets.length,
        avgTime: Math.round(avgTime * 10) / 10,
        satisfaction: teamTickets.length > 0 ? Math.round((completedTeamTickets.length / teamTickets.length) * 100) : 0,
      };
    });

    // Calculate cost analysis
    const costAnalysis = days.map(day => {
      const dayIndex = days.indexOf(day);
      const dayTickets = tickets.filter(ticket => {
        const ticketDate = new Date(ticket.issueTime);
        return ticketDate.getDay() === dayIndex;
      });

      const materialCosts = dayTickets.reduce((acc, ticket) => {
        // Use the ticket's totalCost field which includes all materials
        return acc + (ticket.totalCost || 0);
      }, 0);

      const laborCosts = dayTickets.reduce((acc, ticket) => {
        if (ticket.issueTime && ticket.completionTime) {
          const hours = getHoursBetween(ticket.issueTime, ticket.completionTime);
          return acc + (hours * 100); // Assuming $100 per hour labor cost
        }
        return acc;
      }, 0);

      return {
        month: day,
        materials: Math.round(materialCosts),
        labor: Math.round(laborCosts),
        total: Math.round(materialCosts + laborCosts),
      };
    });

    // Calculate service area distribution (using team locations)
    const serviceAreas = tickets.reduce((acc, ticket) => {
      if (ticket.team?.location) {
        const area = ticket.team.location;
        acc[area] = (acc[area] || 0) + 1;
      }
      return acc;
    }, {});

    const serviceAreaData = Object.entries(serviceAreas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area, count]) => ({
        area,
        tickets: count,
      }));

    // Calculate top customers by ticket count
    const customerTicketCounts = tickets.reduce((acc, ticket) => {
      if (ticket.customer) {
        const customerId = ticket.customer.id;
        if (!acc[customerId]) {
          acc[customerId] = {
            id: customerId,
            name: ticket.customer.name,
            ticketCount: 0,
            completedCount: 0,
          };
        }
        acc[customerId].ticketCount += 1;
        if (ticket.status === 'COMPLETED') {
          acc[customerId].completedCount += 1;
        }
      }
      return acc;
    }, {});

    const topCustomers = Object.values(customerTicketCounts)
      .sort((a, b) => b.ticketCount - a.ticketCount)
      .slice(0, 10)
      .map((customer, index) => ({
        rank: index + 1,
        id: customer.id,
        name: customer.name,
        ticketCount: customer.ticketCount,
        completedCount: customer.completedCount,
        completionRate: customer.ticketCount > 0 
          ? Math.round((customer.completedCount / customer.ticketCount) * 100)
          : 0,
      }));

    // Calculate previous period metrics for comparison
    const previousCompletedTickets = previousTickets.filter(ticket => ticket.status === 'COMPLETED');
    const previousActiveTickets = previousTickets.filter(ticket => 
      ticket.status === 'NEW' || ticket.status === 'IN_PROGRESS' || ticket.status === 'IN_REVIEW'
    ).length;
    
    const previousAvgResolutionTime = previousCompletedTickets.length > 0
      ? previousCompletedTickets.reduce((acc, ticket) => {
          if (ticket.issueTime && ticket.completionTime) {
            return acc + getHoursBetween(ticket.issueTime, ticket.completionTime);
          }
          return acc;
        }, 0) / previousCompletedTickets.length
      : 0;

    // Calculate total costs for both periods
    const currentTotalCost = costAnalysis.reduce((sum, item) => sum + item.total, 0);
    const previousTotalCost = previousTickets.reduce((acc, ticket) => {
      let cost = 0;
      // Materials cost from ticket's totalCost field
      cost += ticket.totalCost || 0;
      // Labor cost
      if (ticket.issueTime && ticket.completionTime) {
        const hours = getHoursBetween(ticket.issueTime, ticket.completionTime);
        cost += hours * 100;
      }
      return acc + cost;
    }, 0);

    // Calculate percentage changes with safe division
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const ticketChange = calculateChange(tickets.length, previousTickets.length);
    const completionChange = calculateChange(completedTickets.length, previousCompletedTickets.length);
    const activeTicketsChange = calculateChange(activeTickets, previousActiveTickets);
    const avgTimeChange = calculateChange(avgResolutionTime, previousAvgResolutionTime);
    const costChange = calculateChange(currentTotalCost, previousTotalCost);

    // Calculate most frequently used materials
    const materialUsageMap = {};
    tickets.forEach(ticket => {
      if (ticket.materialsUsed && Array.isArray(ticket.materialsUsed)) {
        ticket.materialsUsed.forEach(material => {
          const materialId = material.materialId;
          const quantity = material.quantity || 0;
          
          if (!materialUsageMap[materialId]) {
            materialUsageMap[materialId] = {
              materialId: materialId,
              totalQuantity: 0,
              usageCount: 0,
            };
          }
          
          materialUsageMap[materialId].totalQuantity += quantity;
          materialUsageMap[materialId].usageCount += 1;
        });
      }
    });

    // Get material details and create the final array
    const topMaterials = await Promise.all(
      Object.values(materialUsageMap)
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
        .map(async (usage) => {
          const material = materialCatalog.find(m => m.id === usage.materialId);
          return {
            id: usage.materialId,
            name: material?.name || `Unknown Material`,
            totalQuantity: usage.totalQuantity,
            usageCount: usage.usageCount,
            unit: material?.unit || 'PIECE',
            referenceLength: material?.referenceLength,
          };
        })
    );

    // Return all analytics data
    res.status(200).json({
      summary: {
        totalTickets: tickets.length,
        completedTickets: completedTickets.length,
        activeTickets: activeTickets,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        completionRate: tickets.length > 0 
          ? Math.round((completedTickets.length / tickets.length) * 100) 
          : 0,
      },
      trends: {
        ticketChange,
        completionChange,
        activeTicketsChange,
        avgTimeChange,
        costChange,
        previousPeriod: {
          totalTickets: previousTickets.length,
          completedTickets: previousCompletedTickets.length,
          activeTickets: previousActiveTickets,
          avgResolutionTime: Math.round(previousAvgResolutionTime * 10) / 10,
        },
      },
      performanceData,
      rootCauseData,
      technicianPerformance,
      costAnalysis,
      serviceAreaData,
      topCustomers,
      topMaterials,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard analytics data (weekly view)
router.get('/dashboard', async (req, res) => {
  try {
    // Get data for the past week
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);

    const [tickets, weeklyTickets] = await Promise.all([
      // All tickets (to calculate unresolved count properly)
      prisma.ticket.findMany({
        include: {
          rootCause: true,
        },
      }),
      // Tickets from past week for root cause and resolution time analysis
      prisma.ticket.findMany({
        where: {
          issueTime: {
            gte: weekAgo,
          },
        },
        include: {
          rootCause: true,
        },
      }),
    ]);

    // Calculate weekly ticket volume (last 7 days)
    const weeklyData = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(23, 59, 59, 999); // End of day
      
      // Count unresolved tickets at the end of this day
      // A ticket is unresolved if it was created before or on this day
      // AND it was not completed, OR it was completed after this day
      const unresolvedCount = tickets.filter(ticket => {
        const issueDate = new Date(ticket.issueTime);
        
        // Ticket must be created before or on this day
        if (issueDate > date) return false;
        
        // If ticket is not completed, it's unresolved
        if (ticket.status !== 'COMPLETED' || !ticket.completionTime) {
          return true;
        }
        
        // If ticket was completed after this day, it was still unresolved on this day
        const completionDate = new Date(ticket.completionTime);
        return completionDate > date;
      }).length;
      
      weeklyData.push({
        day: dayNames[date.getDay()],
        unresolved: unresolvedCount,
      });
    }

    // Calculate root cause distribution for past week
    const rootCauseCounts = {};
    weeklyTickets.forEach(ticket => {
      if (ticket.rootCause) {
        const name = ticket.rootCause.name;
        rootCauseCounts[name] = (rootCauseCounts[name] || 0) + 1;
      }
    });

    const totalWeeklyTickets = weeklyTickets.length || 1;
    const rootCauseData = Object.entries(rootCauseCounts)
      .map(([name, count]) => ({
        name,
        value: Math.round((count / totalWeeklyTickets) * 100),
        count: count,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate average resolution time by day of week (using past week data)
    const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const completedWeeklyTickets = weeklyTickets.filter(t => t.status === 'COMPLETED' && t.completionTime);
    
    const resolutionTimeData = fullDayNames.map(dayName => {
      const dayTickets = completedWeeklyTickets.filter(ticket => {
        if (ticket.issueTime && ticket.completionTime) {
          const issueDate = new Date(ticket.issueTime);
          const ticketDayName = fullDayNames[issueDate.getDay()];
          return ticketDayName === dayName;
        }
        return false;
      });

      const avgResolution = dayTickets.length > 0
        ? dayTickets.reduce((acc, ticket) => {
            return acc + getHoursBetween(ticket.issueTime, ticket.completionTime);
          }, 0) / dayTickets.length
        : null; // null instead of 0 to avoid showing misleading data

      return {
        day: dayName.substring(0, 3), // Mon, Tue, etc.
        avgTime: avgResolution !== null ? Math.round(avgResolution * 10) / 10 : null,
        ticketCount: dayTickets.length,
      };
    });

    res.json({
      weeklyData,
      rootCauseData,
      resolutionTimeData,
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
