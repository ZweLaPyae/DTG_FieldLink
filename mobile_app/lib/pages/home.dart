// lib/home.dart
import 'package:flutter/material.dart';
import '../models.dart';
import '../data_service.dart';
import 'ticket_detail.dart';

class HomePage extends StatelessWidget {
  final DataService dataService = DataService(jsonPath: 'lib/mock_database.json');

  HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: const Color.fromARGB(255, 122, 182, 212),
        title: const Text('DTG FieldLink', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white)),
        leading: const Padding(
          padding: EdgeInsets.only(left: 12),
          child: Icon(Icons.wifi, color: Colors.white),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(20)),
            child: const Text('3 new', style: TextStyle(color: Colors.white)),
          ),
          IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_none, color: Colors.white)),
          const Padding(
            padding: EdgeInsets.only(right: 12),
            child: CircleAvatar(radius: 16, backgroundImage: AssetImage('assets/profile.jpg')),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            margin: const EdgeInsets.only(bottom: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Assigned Tickets',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
                ElevatedButton.icon(
                  icon: const Icon(Icons.filter_list, size: 18, color: const Color.fromARGB(255, 122, 182, 212)),
                  label: const Text('Filter', style: TextStyle(color: const Color.fromARGB(255, 122, 182, 212))),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color.fromARGB(255, 122, 182, 212).withOpacity(0.1),
                    foregroundColor: const Color.fromARGB(255, 122, 182, 212),
                    elevation: 0,
                  ),
                  onPressed: () {},
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          const Text('Latest maintenance requests', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 10),
          const SizedBox(height: 12),
          Expanded(
            child: FutureBuilder<List<Ticket>>(
              future: dataService.loadTickets(),
              builder: (context, snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }
                final tickets = snapshot.data ?? [];
                return ListView.builder(
                  itemCount: tickets.length,
                  itemBuilder: (context, index) {
                    final t = tickets[index];
                    return _ticketCard(context, t);
                  },
                );
              },
            ),
          ),
        ]),
      ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: const Color.fromARGB(255, 122, 182, 212),
        currentIndex: 0,
        selectedItemColor: Colors.white,
        unselectedItemColor: Colors.white70,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined, color: Colors.white), label: 'Tickets'),
          BottomNavigationBarItem(icon: Icon(Icons.notifications_outlined, color: Colors.white), label: 'Alerts'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline, color: Colors.white), label: 'Profile'),
        ],
      ),
    );
  }

  Widget _ticketCard(BuildContext context, Ticket t) {
    Color statusColor = Colors.grey;
    if (t.status.toLowerCase().contains('in-progress')) statusColor = Colors.orange;
    if (t.status.toLowerCase().contains('completed')) statusColor = Colors.green;
    if (t.priority.toLowerCase().contains('high')) statusColor = Colors.red;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [
        BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6, offset: const Offset(0, 4))
      ]),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(t.id, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          Row(children: [
            _chip(t.statusDisplay, statusColor),
            const SizedBox(width: 6),
            _chip(t.priorityDisplay, Colors.redAccent),
          ])
        ]),
        const SizedBox(height: 10),
        _infoRow('Customer', t.customerNameDisplay),
        _infoRow('Issue', t.complaint),
        _infoRow('Location', t.location),
        _infoRow('SLA', t.sla),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color.fromARGB(255, 122, 182, 212),
                side: BorderSide(color: const Color.fromARGB(255, 122, 182, 212)),
              ),
              child: const Text('Reject'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => TicketDetailPage(ticketId: t.id)));
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color.fromARGB(255, 122, 182, 212),
                foregroundColor: Colors.white,
              ),
              child: const Text('View Details'),
            ),
          ),
        ])
      ]),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        SizedBox(width: 90, child: Text(label, style: const TextStyle(color: Colors.grey))),
        Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600))),
      ]),
    );
  }

  Widget _chip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(20)),
      child: Text(text, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
    );
  }
}
