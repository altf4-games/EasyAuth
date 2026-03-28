import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const EasyAuthFlutterDemo());
}

class EasyAuthFlutterDemo extends StatelessWidget {
  const EasyAuthFlutterDemo({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EasyAuth Flutter Demo',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
